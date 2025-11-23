package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
//import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.InvoiceNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class InvoiceNotificationServiceImpl implements InvoiceNotificationService {

    private final CustomerNotificationRepository notificationRepository;
//    private final CustomerNotificationEmailService emailService;
    private final InvoicePdfExportService invoicePdfExportService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MONTH_YEAR_FMT = DateTimeFormatter.ofPattern("MM/yyyy");

    // TODO: đưa vào application.yml
    private static final String COMPANY_ADDR = "Số 8, Trần Phú, Phường Tân Dân, TP Việt Trì, Phú Thọ";
    private static final String COMPANY_PHONE = "0210 6251998 / 0210 3992369";
    private static final String COMPANY_EMAIL = "cskh@capnuocphutho.vn";
    private static final String BANK_ACCOUNT = "0123456789";
    private static final String BANK_NAME = "Vietinbank CN Phú Thọ";

    // ---------------------------
    // 1. HÓA ĐƠN TIỀN NƯỚC
    // ---------------------------
    @Override
    public void sendWaterBillIssued(Invoice invoice, MeterReading reading) {

        String pdfPath = invoicePdfExportService.exportWaterBillPdf(
                invoice,
                reading,
                COMPANY_ADDR, COMPANY_PHONE, COMPANY_EMAIL,
                BANK_ACCOUNT, BANK_NAME
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
        //emailService.sendEmail(n);
    }

    // ---------------------------
    // 2. HÓA ĐƠN LẮP ĐẶT
    // ---------------------------
    @Override
    public void sendInstallationInvoiceIssued(Invoice invoice, Contract contract) {

        String pdfPath = invoicePdfExportService.exportInstallationInvoicePdf(
                invoice,
                contract.getContractNumber(),      // <--- CHỈNH LẠI
                contract.getCreatedAt() != null ?
                        contract.getCreatedAt().toLocalDate() : LocalDate.now(),
                COMPANY_ADDR, COMPANY_PHONE, COMPANY_EMAIL,
                BANK_ACCOUNT, BANK_NAME
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
        //emailService.sendEmail(n);
    }


    // ---------------------------
    // 3. HÓA ĐƠN DỊCH VỤ PHÁT SINH
    // ---------------------------
    @Override
    public void sendServiceInvoiceIssued(Invoice invoice, String serviceDescription, String vatRate) {

        String pdfPath = invoicePdfExportService.exportServiceInvoicePdf(
                invoice,
                serviceDescription,
                vatRate,
                COMPANY_ADDR, COMPANY_PHONE, COMPANY_EMAIL,
                BANK_ACCOUNT, BANK_NAME
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
        //emailService.sendEmail(n);
    }
}
