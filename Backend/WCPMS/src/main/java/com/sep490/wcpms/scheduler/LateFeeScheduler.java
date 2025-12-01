package com.sep490.wcpms.scheduler;

import com.sep490.wcpms.dto.PaymentLinkDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.MeterCalibrationRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.PaymentService;
import com.sep490.wcpms.service.impl.InvoicePdfExportService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LateFeeScheduler {

    private static final Logger logger = LoggerFactory.getLogger(LateFeeScheduler.class);

    private final InvoiceRepository invoiceRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final InvoicePdfExportService invoicePdfExportService;
    private final MeterCalibrationRepository calibrationRepository;
    private final PaymentService paymentService;

    // Phí nộp muộn mặc định
    private static final BigDecimal LATE_FEE_AMOUNT = new BigDecimal("35000");

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Thông tin công ty – dùng chung với các PDF khác
    private static final String COMPANY_ADDR = "Số 8, Trần Phú, Phường Tân Dân, TP Việt Trì, Phú Thọ";
    private static final String COMPANY_PHONE = "0210 6251998 / 0210 3992369";
    private static final String COMPANY_EMAIL = "cskh@capnuocphutho.vn";

    /**
     * Chạy mỗi ngày vào lúc 8:00 sáng.
     * Cron expression: "giây phút giờ ngày tháng thứ"
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void calculateLateFees() {
        logger.info("Bắt đầu tác vụ tự động: Tính phí phạt trả chậm...");

        LocalDate today = LocalDate.now();

        // 1. Tìm các hóa đơn quá hạn cần xử lý
        List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(today);

        if (overdueInvoices.isEmpty()) {
            logger.info("Không có hóa đơn nào quá hạn hôm nay.");
            return;
        }

        int count = 0;

        for (Invoice invoice : overdueInvoices) {
            try {
                applyLateFeeAndNotify(invoice);
                count++;
            } catch (Exception e) {
                logger.error("Lỗi khi xử lý hóa đơn ID " + invoice.getId(), e);
            }
        }

        logger.info("Hoàn tất. Đã cập nhật phí phạt + gửi thông báo cho {} hóa đơn.", count);
    }

    private void applyLateFeeAndNotify(Invoice invoice) {
        // 1. Áp dụng phí phạt nếu chưa có
        BigDecimal currentLateFee = invoice.getLatePaymentFee();
        if (currentLateFee == null || currentLateFee.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setLatePaymentFee(LATE_FEE_AMOUNT);

            // Cộng thêm vào tổng tiền
            BigDecimal newTotal = invoice.getTotalAmount().add(LATE_FEE_AMOUNT);
            invoice.setTotalAmount(newTotal);

            // Đổi trạng thái sang OVERDUE
            invoice.setPaymentStatus(Invoice.PaymentStatus.OVERDUE);

            invoiceRepository.save(invoice);
        }

        // 2. Gửi thông báo quá hạn + đính kèm PDF mới
        sendLatePaymentNotification(invoice);
    }

    private void sendLatePaymentNotification(Invoice invoice) {
        Customer customer = invoice.getCustomer();
        if (customer == null) {
            logger.warn("[LATE-FEE] Invoice id={} không có customer, bỏ qua gửi email.", invoice.getId());
            return;
        }

        // Tránh gửi trùng
        boolean exists = notificationRepository.existsByInvoiceAndMessageType(
                invoice,
                CustomerNotification.CustomerNotificationMessageType.LATE_PAYMENT_NOTICE
        );
        if (exists) {
            logger.info("[LATE-FEE] Đã có LATE_PAYMENT_NOTICE cho invoice {}, bỏ qua.", invoice.getInvoiceNumber());
            return;
        }

        // 2.1. Sinh lại PDF mới sau khi đã cộng phí nộp muộn
        String pdfPath = null;
        try {
            pdfPath = exportUpdatedInvoicePdf(invoice);
        } catch (Exception e) {
            logger.error("[LATE-FEE] Lỗi khi xuất PDF cho invoice {}: ", invoice.getInvoiceNumber(), e);
        }

        // 2.2. Tạo bản ghi CustomerNotification
        CustomerNotification n = new CustomerNotification();
        n.setCustomer(customer);
        n.setInvoice(invoice);
        n.setMessageType(CustomerNotification.CustomerNotificationMessageType.LATE_PAYMENT_NOTICE);
        n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);
        n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
        if (invoice.getContract() != null) {
            n.setRelatedId(invoice.getContract().getId());
        }

        if (pdfPath != null) {
            n.setAttachmentUrl(pdfPath);
        }

        String dueDateStr = invoice.getDueDate() != null
                ? invoice.getDueDate().format(DATE_FMT)
                : "đã hết hạn";

        BigDecimal lateFee = invoice.getLatePaymentFee() != null
                ? invoice.getLatePaymentFee()
                : LATE_FEE_AMOUNT;

        String subject = String.format(
                "Thông báo quá hạn thanh toán và phí nộp muộn - Hóa đơn %s",
                invoice.getInvoiceNumber()
        );

        String body = String.format(
                "Kính gửi Quý khách %s,%n%n" +
                        "Hóa đơn số %s (hạn thanh toán: %s) hiện đã quá hạn thanh toán.%n" +
                        "Hệ thống đã tính phí nộp muộn: %sđ.%n" +
                        "Tổng số tiền phải thanh toán hiện tại là: %sđ.%n%n" +
                        "Kính đề nghị Quý khách sớm thanh toán để tránh phát sinh thêm chi phí.%n%n" +
                        "Trân trọng,%n" +
                        "Công ty Cấp nước Phú Thọ",
                customer.getCustomerName(),
                invoice.getInvoiceNumber(),
                dueDateStr,
                lateFee.toPlainString(),
                invoice.getTotalAmount().toPlainString()
        );

        n.setMessageSubject(subject);
        n.setMessageContent(body);
        n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
        n.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(n);

        // 2.3. Gửi email
        emailService.sendEmail(n);

        logger.info("[LATE-FEE] Đã gửi thông báo quá hạn cho invoice {} (customer id={})",
                invoice.getInvoiceNumber(), customer.getId());
    }

    /**
     * Sinh PDF mới tương ứng loại hóa đơn:
     *  - Hóa đơn tiền nước      -> notice-water-bill
     *  - Hóa đơn lắp đặt        -> notice-installation-invoice
     *  - Hóa đơn dịch vụ phát sinh -> notice-service-invoice
     *
     * Các template đã được sửa để hiển thị thêm dòng "Phí nộp muộn"
     * khi invoice.getLatePaymentFee() > 0.
     */
    private String exportUpdatedInvoicePdf(Invoice invoice) {
        PaymentLinkDTO payLink = null;
        try {
            payLink = paymentService.createPaymentLink(invoice.getId());
        } catch (Exception e) {
            logger.error("[LATE-FEE] Lỗi tạo PaymentLink PayOS cho invoice {}: {}", invoice.getId(), e.getMessage());
        }

        String bankAccount = payLink != null ? payLink.getAccountNumber() : null;
        String bankName = payLink != null ? payLink.getAccountName() : null;

        // Phân loại loại hóa đơn giống bên InvoiceNotificationServiceImpl
        boolean isWater = isWaterInvoice(invoice);
        boolean isService = isServiceInvoice(invoice);
        boolean isInstallation = isInstallationInvoice(invoice);

        // 1. HÓA ĐƠN TIỀN NƯỚC
        if (isWater && !isService) {
            MeterReading reading = invoice.getMeterReading();
            return invoicePdfExportService.exportWaterBillPdf(
                    invoice,
                    reading,
                    COMPANY_ADDR,
                    COMPANY_PHONE,
                    COMPANY_EMAIL,
                    bankAccount,
                    bankName
            );
        }

        // 2. HÓA ĐƠN DỊCH VỤ PHÁT SINH
        if (isService) {
            // dùng y hệt mô tả + VAT đang dùng khi phát hành:
            String serviceDescription = "Phí kiểm định đồng hồ nước";
            String vatRate = "5%";
            return invoicePdfExportService.exportServiceInvoicePdf(
                    invoice,
                    serviceDescription,
                    vatRate,
                    COMPANY_ADDR,
                    COMPANY_PHONE,
                    COMPANY_EMAIL,
                    bankAccount,
                    bankName
            );
        }

        // 3. CÒN LẠI: HÓA ĐƠN LẮP ĐẶT
        Contract contract = invoice.getContract();
        String contractCode = contract != null ? contract.getContractNumber() : null;
        LocalDate contractSignDate =
                (contract != null && contract.getCreatedAt() != null)
                        ? contract.getCreatedAt().toLocalDate()
                        : LocalDate.now();

        return invoicePdfExportService.exportInstallationInvoicePdf(
                invoice,
                contractCode,
                contractSignDate,
                COMPANY_ADDR,
                COMPANY_PHONE,
                COMPANY_EMAIL,
                bankAccount,
                bankName
        );
    }

    // ==== Helper phân loại loại hóa đơn (copy logic từ InvoiceNotificationServiceImpl) ====

    private boolean isWaterInvoice(Invoice invoice) {
        // Hóa đơn tiền nước: có meterReading
        return invoice.getMeterReading() != null;
    }

    private boolean isServiceInvoice(Invoice invoice) {
        // Hóa đơn dịch vụ phát sinh: có bản ghi MeterCalibration gắn với invoice
        return calibrationRepository.findByInvoice(invoice).isPresent()
                && invoice.getMeterReading() == null;
    }

    private boolean isInstallationInvoice(Invoice invoice) {
        // Hóa đơn lắp đặt: không meterReading, không calibration
        return invoice.getMeterReading() == null
                && calibrationRepository.findByInvoice(invoice).isEmpty();
    }
}
