package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.PaymentLinkDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.MeterCalibrationRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.InvoiceNotificationService;
import com.sep490.wcpms.service.LeakDetectionNotificationService;
import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class InvoiceNotificationServiceImpl implements InvoiceNotificationService {

    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final InvoicePdfExportService invoicePdfExportService;
    private final MeterCalibrationRepository calibrationRepository;
    private final LeakDetectionNotificationService leakDetectionNotificationService;
    private final PaymentService paymentService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MONTH_YEAR_FMT = DateTimeFormatter.ofPattern("MM/yyyy");

    private static final String COMPANY_ADDR = "Số 8, Trần Phú, Phường Tân Dân, TP Việt Trì, Phú Thọ";
    private static final String COMPANY_PHONE = "0210 6251998 / 0210 3992369";
    private static final String COMPANY_EMAIL = "cskh@capnuocphutho.vn";

    // VALIDATE: 3 loại hóa đơn
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

    // Lấy PaymentLink từ PayOS cho hóa đơn; nếu lỗi thì trả null
    private PaymentLinkDTO getPaymentLink(Invoice invoice) {
        try {
            PaymentLinkDTO link = paymentService.createPaymentLink(invoice.getId());
            if (link == null) {
                System.err.println("[InvoiceNotification] PayOS trả null cho invoice " + invoice.getId());
            } else {
                System.out.println("[InvoiceNotification] PayOS link cho invoice " + invoice.getId()
                        + " | accountNumber=" + link.getAccountNumber()
                        + " | accountName=" + link.getAccountName());
            }
            return link;
        } catch (Exception e) {
            System.err.println("[InvoiceNotification] Lỗi gọi PayOS cho invoice "
                    + invoice.getId() + ": " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // ---------------------------
    // 1. HÓA ĐƠN TIỀN NƯỚC
    // ---------------------------
    @Override
    public void sendWaterBillIssued(Invoice invoice, MeterReading reading) {

        // VALIDATE: phải là hóa đơn tiền nước
        if (!isWaterInvoice(invoice) || isServiceInvoice(invoice)) {
            throw new IllegalArgumentException(
                    "Hóa đơn ID=" + invoice.getId() + " không phải HÓA ĐƠN TIỀN NƯỚC."
            );
        }

        if (reading == null) {
            reading = invoice.getMeterReading();
        } else if (!reading.getId().equals(invoice.getMeterReading().getId())) {
            throw new IllegalArgumentException("MeterReading không khớp với hóa đơn.");
        }

        // LẤY THÔNG TIN TÀI KHOẢN TỪ PAYOS
        PaymentLinkDTO payLink = getPaymentLink(invoice);
        String bankAccount = payLink != null ? payLink.getAccountNumber() : null;
        String bankName = payLink != null ? payLink.getAccountName() : null;

        // EXPORT PDF
        String pdfPath = invoicePdfExportService.exportWaterBillPdf(
                invoice,
                reading,
                COMPANY_ADDR,
                COMPANY_PHONE,
                COMPANY_EMAIL,
                bankAccount,
                bankName
        );

        Customer customer = invoice.getCustomer();

        CustomerNotification n = new CustomerNotification();
        n.setCustomer(customer);
        n.setInvoice(invoice);
        n.setAttachmentUrl(pdfPath);

        n.setMessageType(CustomerNotification.CustomerNotificationMessageType.WATER_BILL_ISSUED);
        n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.ACCOUNTANT);
        n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.METER_READING);

        if (reading != null) {
            n.setRelatedId(reading.getId());
        }

        String monthYear = invoice.getFromDate() == null ?
                "" : invoice.getFromDate().format(MONTH_YEAR_FMT);

        String subject = "Thông báo tiền nước tháng " + monthYear;

        String body = String.format(
                "TB tiền nước %s: KH %s, ghi ngày %s, SD %s m³, số tiền %sđ.\n" +
                        "Đề nghị thanh toán từ %s đến %s hoặc chuyển khoản qua ngân hàng.\n\n" +
                        "(Chi tiết hóa đơn trong file PDF đính kèm.)",
                monthYear,
                customer.getCustomerCode(),
                reading != null ? reading.getReadingDate().format(DATE_FMT) : "",
                invoice.getTotalConsumption(),
                invoice.getTotalAmount(),
                invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().format(DATE_FMT) : "",
                invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : ""
        );

        n.setMessageSubject(subject);
        n.setMessageContent(body);

        notificationRepository.save(n);
        emailService.sendEmail(n);

        // Kiểm tra cảnh báo rò rỉ nước cho hóa đơn nước hiện tại
        leakDetectionNotificationService.checkAndSendLeakWarning(invoice);
    }

    // ---------------------------
    // 2. HÓA ĐƠN LẮP ĐẶT
    // ---------------------------
    @Override
    public void sendInstallationInvoiceIssued(Invoice invoice, Contract contract) {

        // VALIDATE: phải là hóa đơn lắp đặt đồng hồ nước
        if (!isInstallationInvoice(invoice)) {
            throw new IllegalArgumentException(
                    "Hóa đơn ID=" + invoice.getId() + " không phải HÓA ĐƠN LẮP ĐẶT."
            );
        }

        // LẤY THÔNG TIN TÀI KHOẢN TỪ PAYOS
        PaymentLinkDTO payLink = getPaymentLink(invoice);
        String bankAccount = payLink != null ? payLink.getAccountNumber() : null;
        String bankName = payLink != null ? payLink.getAccountName() : null;

        // EXPORT PDF
        String pdfPath = invoicePdfExportService.exportInstallationInvoicePdf(
                invoice,
                contract.getContractNumber(),      // <--- CHỈNH LẠI
                contract.getCreatedAt() != null ?
                        contract.getCreatedAt().toLocalDate() : LocalDate.now(),
                COMPANY_ADDR,
                COMPANY_PHONE,
                COMPANY_EMAIL,
                bankAccount,
                bankName
        );

        Customer customer = invoice.getCustomer();

        CustomerNotification n = new CustomerNotification();
        n.setCustomer(customer);
        n.setInvoice(invoice);
        n.setAttachmentUrl(pdfPath);

        n.setMessageType(CustomerNotification.CustomerNotificationMessageType.INSTALLATION_INVOICE_ISSUED);
        n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.ACCOUNTANT);

        n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
        n.setRelatedId(contract.getId());

        String subject = "Hóa đơn lắp đặt cho Hợp đồng " + contract.getContractNumber();

        String body = String.format(
                "Kính gửi Quý khách %s,\n\n" +
                        "Hóa đơn lắp đặt cho Hợp đồng số %s đã được phát hành.\n" +
                        "Số hóa đơn: %s\n" +
                        "Số tiền phải thanh toán: %sđ\n" +
                        "Hạn thanh toán: %s\n\n" +
                        "Chi tiết trong file PDF đính kèm.",
                customer.getCustomerName(),
                contract.getContractNumber(),
                invoice.getInvoiceNumber(),
                invoice.getTotalAmount(),
                invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : ""
        );

        n.setMessageSubject(subject);
        n.setMessageContent(body);

        notificationRepository.save(n);
        emailService.sendEmail(n);
    }


    // ---------------------------
    // 3. HÓA ĐƠN DỊCH VỤ PHÁT SINH
    // ---------------------------
    @Override
    public void sendServiceInvoiceIssued(Invoice invoice, String serviceDescription, String vatRate) {

        // VALIDATE: phải là hóa đơn dịch vụ phát sinh
        if (!isServiceInvoice(invoice)) {
            throw new IllegalArgumentException(
                    "Hóa đơn ID=" + invoice.getId() + " không phải HÓA ĐƠN DỊCH VỤ PHÁT SINH."
            );
        }

        // LẤY THÔNG TIN TÀI KHOẢN TỪ PAYOS
        PaymentLinkDTO payLink = getPaymentLink(invoice);
        String bankAccount = payLink != null ? payLink.getAccountNumber() : null;
        String bankName = payLink != null ? payLink.getAccountName() : null;

        // EXPORT PDF
        String pdfPath = invoicePdfExportService.exportServiceInvoicePdf(
                invoice,
                serviceDescription,
                vatRate,
                COMPANY_ADDR,
                COMPANY_PHONE,
                COMPANY_EMAIL,
                bankAccount,
                bankName
        );

        Customer customer = invoice.getCustomer();

        CustomerNotification n = new CustomerNotification();
        n.setCustomer(customer);
        n.setInvoice(invoice);
        n.setAttachmentUrl(pdfPath);
        n.setMessageType(CustomerNotification.CustomerNotificationMessageType.SERVICE_INVOICE_ISSUED);
        n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.ACCOUNTANT);
        n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.NONE);

        String subject = "Thông báo hóa đơn dịch vụ phát sinh";

        String body = String.format(
                "Kính gửi Quý khách %s,\n\n" +
                        "Hóa đơn dịch vụ phát sinh (%s) đã được phát hành.\n" +
                        "Số hóa đơn: %s\n" +
                        "Số tiền phải thanh toán: %sđ\n" +
                        "Hạn thanh toán: %s\n\n" +
                        "Chi tiết trong file PDF đính kèm.",
                customer.getCustomerName(),
                serviceDescription,
                invoice.getInvoiceNumber(),
                invoice.getTotalAmount(),
                invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : ""
        );

        n.setMessageSubject(subject);
        n.setMessageContent(body);

        notificationRepository.save(n);
        emailService.sendEmail(n);
    }
}
