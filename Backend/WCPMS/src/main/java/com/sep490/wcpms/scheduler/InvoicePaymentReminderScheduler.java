package com.sep490.wcpms.scheduler;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.repository.MeterCalibrationRepository;
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
public class InvoicePaymentReminderScheduler {

    private final InvoiceRepository invoiceRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final MeterCalibrationRepository calibrationRepository;

    // nhắc trước hạn 5 ngày
    private static final int REMIND_DAYS_BEFORE_DUE = 5;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // --- Helper phân loại hoá đơn (copy style từ InvoiceNotificationServiceImpl) ---

    private boolean isWaterInvoice(Invoice invoice) {
        return invoice.getMeterReading() != null;
    }

    private boolean isServiceInvoice(Invoice invoice) {
        return calibrationRepository.findByInvoice(invoice).isPresent()
                && invoice.getMeterReading() == null;
    }

    private boolean isInstallationInvoice(Invoice invoice) {
        return invoice.getMeterReading() == null
                && calibrationRepository.findByInvoice(invoice).isEmpty();
    }

    private String getInvoiceTypeLabel(Invoice invoice) {
        if (isWaterInvoice(invoice)) {
            return "Hóa đơn tiền nước";
        }
        if (isInstallationInvoice(invoice)) {
            return "Hóa đơn lắp đặt";
        }
        if (isServiceInvoice(invoice)) {
            return "Hóa đơn dịch vụ phát sinh";
        }
        return "Hóa đơn";
    }

    // Chạy hằng ngày lúc 08:15 sáng
    @Scheduled(cron = "0 15 8 * * *")
    @Transactional
    public void sendInvoicePaymentReminders() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate targetDueDate = today.plusDays(REMIND_DAYS_BEFORE_DUE);

            List<Invoice.PaymentStatus> statuses = Arrays.asList(
                    Invoice.PaymentStatus.PENDING,
                    Invoice.PaymentStatus.PARTIALLY_PAID
            );

            List<Invoice> invoices = invoiceRepository.findByPaymentStatusInAndDueDate(
                    statuses,
                    targetDueDate
            );

            if (invoices.isEmpty()) {
                return;
            }

            for (Invoice invoice : invoices) {
                processInvoice(invoice);
            }
        } catch (Exception ex) {
            log.error("[INVOICE-PAYMENT-REMINDER] Error in scheduler: {}", ex.getMessage(), ex);
        }
    }

    private void processInvoice(Invoice invoice) {
        try {
            if (invoice.getCustomer() == null || invoice.getDueDate() == null) {
                return;
            }

            // Đã nhắc PAYMENT_REMINDER cho hóa đơn này rồi -> bỏ
            boolean exists = notificationRepository.existsByInvoiceAndMessageType(
                    invoice,
                    CustomerNotification.CustomerNotificationMessageType.PAYMENT_REMINDER
            );
            if (exists) {
                return;
            }

            Customer customer = invoice.getCustomer();
            String invoiceTypeLabel = getInvoiceTypeLabel(invoice);

            // Lấy lại PDF cũ (nếu có) từ thông báo đã phát hành trước đó
            CustomerNotification prevWithPdf =
                    notificationRepository.findTop1ByInvoiceAndAttachmentUrlIsNotNullOrderByCreatedAtDesc(invoice);

            String attachmentUrl = prevWithPdf != null ? prevWithPdf.getAttachmentUrl() : null;

            // Tạo notification nhắc thanh toán
            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(invoice);
            n.setAttachmentUrl(attachmentUrl);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.PAYMENT_REMINDER);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);
            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);

            if (invoice.getContract() != null) {
                n.setRelatedId(invoice.getContract().getId());
            }

            String dueDateStr = invoice.getDueDate().format(DATE_FMT);

            String subject = String.format(
                    "Nhắc thanh toán %s số %s",
                    invoiceTypeLabel,
                    invoice.getInvoiceNumber()
            );

            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hệ thống xin nhắc Quý khách thanh toán %s số %s với số tiền %sđ.%n" +
                            "Hạn thanh toán đến ngày %s.%n%n" +
                            "Nếu Quý khách đã thanh toán, vui lòng bỏ qua thông báo này.%n%n" +
                            "Trân trọng,%n" +
                            "Công ty Cấp nước Phú Thọ",
                    customer.getCustomerName(),
                    invoiceTypeLabel.toLowerCase(),
                    invoice.getInvoiceNumber(),
                    invoice.getTotalAmount(),
                    dueDateStr
            );

            n.setMessageSubject(subject);
            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);

        } catch (Exception ex) {
            log.error("[INVOICE-PAYMENT-REMINDER] Error processing invoice id={}: {}",
                    invoice.getId(), ex.getMessage(), ex);
        }
    }
}

