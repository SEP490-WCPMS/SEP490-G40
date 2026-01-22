package com.sep490.wcpms.scheduler;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.WaterServiceContractRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.CustomerNotificationSmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractTerminationScheduler {

    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;
    private final WaterServiceContractRepository waterServiceContractRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final CustomerNotificationSmsService smsService;

    private static final int DAYS_AFTER_DUE_TO_TERMINATE = 10;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String HOTLINE = "0210 6251998";

    // Chạy mỗi ngày lúc 00:01
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void autoTerminateContractsForUnpaidWaterInvoices() {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.minusDays(DAYS_AFTER_DUE_TO_TERMINATE);

        List<Invoice.PaymentStatus> statuses = List.of(Invoice.PaymentStatus.OVERDUE);

        List<Invoice> invoices = invoiceRepository.findOverdueWaterInvoicesPastDueDate(cutoff);
        if (invoices.isEmpty()) return;

        for (Invoice invoice : invoices) {
            processInvoice(invoice, today);
        }
    }

    private void processInvoice(Invoice invoice, LocalDate today) {
        try {
            if (invoice == null || invoice.getContract() == null) return;

            Contract contract = invoice.getContract();

            // Nếu đã terminated/expired thì bỏ qua
            if (contract.getContractStatus() == Contract.ContractStatus.TERMINATED
                    || contract.getContractStatus() == Contract.ContractStatus.EXPIRED) {
                return;
            }

            // 1) Chấm dứt hợp đồng (Contract)
            contract.setContractStatus(Contract.ContractStatus.TERMINATED);
            contract.setEndDate(today);

            String dueStr = (invoice.getDueDate() != null) ? invoice.getDueDate().format(DATE_FMT) : "";
            String noteLine = String.format(
                    "[SYSTEM] Đơn phương chấm dứt do quá hạn thanh toán hóa đơn tiền nước %s (hạn %s) quá %d ngày.",
                    invoice.getInvoiceNumber(), dueStr, DAYS_AFTER_DUE_TO_TERMINATE
            );

            String existing = contract.getNotes();
            contract.setNotes(existing == null || existing.isBlank() ? noteLine : existing + "\n" + noteLine);

            // 2) Đồng bộ WaterServiceContract (nếu có)
            if (contract.getPrimaryWaterContract() != null) {
                WaterServiceContract wsc = contract.getPrimaryWaterContract();
                wsc.setContractStatus(WaterServiceContract.WaterServiceContractStatus.TERMINATED);
                wsc.setServiceEndDate(today);
                waterServiceContractRepository.save(wsc);
            }

            contractRepository.save(contract);

            // 3) Tạo notification + gửi email/SMS (tránh gửi trùng)
            boolean notified = notificationRepository.existsByRelatedTypeAndRelatedIdAndMessageType(
                    CustomerNotification.CustomerNotificationRelatedType.CONTRACT,
                    contract.getId(),
                    CustomerNotification.CustomerNotificationMessageType.CONTRACT_TERMINATED
            );
            if (!notified) {
                sendTerminationNotification(invoice, contract, today);
            }

        } catch (Exception ex) {
            log.error("[AUTO-TERMINATE] invoiceId={} error={}", invoice != null ? invoice.getId() : null, ex.getMessage(), ex);
        }
    }

    private void sendTerminationNotification(Invoice invoice, Contract contract, LocalDate today) {
        Customer customer = invoice.getCustomer();
        if (customer == null) return;

        CustomerNotification n = new CustomerNotification();
        n.setCustomer(customer);
        n.setInvoice(invoice);
        n.setMessageType(CustomerNotification.CustomerNotificationMessageType.CONTRACT_TERMINATED);
        n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);
        n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
        n.setRelatedId(contract.getId());

        String due = (invoice.getDueDate() != null) ? invoice.getDueDate().format(DATE_FMT) : "không xác định";
        String terminatedDate = today.format(DATE_FMT);

        String subject = String.format(
                "Thông báo chấm dứt hợp đồng %s do quá hạn thanh toán",
                contract.getContractNumber()
        );

        String body = String.format(
                "Kính gửi Quý khách %s,%n%n" +
                        "Hóa đơn tiền nước số %s (hạn thanh toán: %s) đến nay vẫn chưa được thanh toán sau %d ngày quá hạn.%n" +
                        "Công ty đơn phương chấm dứt hợp đồng cấp nước số %s từ ngày %s.%n%n" +
                        "Để được hỗ trợ/trao đổi phương án xử lý, vui lòng liên hệ tổng đài %s.%n%n" +
                        "Trân trọng,%n" +
                        "Công ty Cấp nước Phú Thọ",
                customer.getCustomerName(),
                invoice.getInvoiceNumber(),
                due,
                DAYS_AFTER_DUE_TO_TERMINATE,
                contract.getContractNumber(),
                terminatedDate,
                HOTLINE
        );

        n.setMessageSubject(subject);
        n.setMessageContent(body);
        n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
        n.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(n);

        // Gửi giống các scheduler khác
        emailService.sendEmail(n);
        smsService.sendForNotification(n);
    }
}
