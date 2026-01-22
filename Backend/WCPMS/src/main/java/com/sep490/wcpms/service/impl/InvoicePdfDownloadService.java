package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.MeterCalibrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicePdfDownloadService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final MeterCalibrationRepository calibrationRepository;

    private final InvoicePdfExportService invoicePdfExportService;

    // Thông tin công ty (giống InvoiceNotificationServiceImpl)
    private static final String COMPANY_ADDR = "Số 8, Trần Phú, Phường Tân Dân, TP Việt Trì, Phú Thọ";
    private static final String COMPANY_PHONE = "0210 6251998 / 0210 3992369";
    private static final String COMPANY_EMAIL = "cskh@capnuocphutho.vn";

    public record PdfResult(String invoiceNumber, byte[] bytes) {}

    @Transactional(readOnly = true)
    public PdfResult downloadForCustomer(Integer customerAccountId, Integer invoiceId) {
        Customer customer = customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng của account: " + customerAccountId));

        Invoice invoice = invoiceRepository.findByIdAndCustomer(invoiceId, customer)
                .orElseThrow(() -> new AccessDeniedException("Bạn không có quyền truy cập hóa đơn: " + invoiceId));

        return new PdfResult(invoice.getInvoiceNumber(), generateFreshPdfBytes(invoice));
    }

    @Transactional(readOnly = true)
    public PdfResult downloadForAccounting(Integer accountingStaffId, Integer invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndAccountingStaff_Id(invoiceId, accountingStaffId)
                .orElseThrow(() -> new AccessDeniedException("Hóa đơn không thuộc nhân viên kế toán này hoặc không tồn tại: " + invoiceId));

        return new PdfResult(invoice.getInvoiceNumber(), generateFreshPdfBytes(invoice));
    }

    private boolean isWaterInvoice(Invoice invoice) {
        return invoice.getMeterReading() != null;
    }

    private boolean isServiceInvoice(Invoice invoice) {
        return invoice.getMeterReading() == null
                && calibrationRepository.findByInvoice(invoice).isPresent();
    }

    private boolean isInstallationInvoice(Invoice invoice) {
        return invoice.getMeterReading() == null
                && calibrationRepository.findByInvoice(invoice).isEmpty();
    }

    private byte[] generateFreshPdfBytes(Invoice invoice) {
        if (invoice == null) throw new ResourceNotFoundException("Invoice null");

        String pdfPath;

        try {
            if (isWaterInvoice(invoice)) {
                MeterReading reading = invoice.getMeterReading();
                pdfPath = invoicePdfExportService.exportWaterBillPdf(
                        invoice,
                        reading,
                        COMPANY_ADDR, COMPANY_PHONE, COMPANY_EMAIL,
                        null, null
                );

            } else if (isServiceInvoice(invoice)) {
                // theo yêu cầu: diễn giải cố định + VAT 5% (service)
                pdfPath = invoicePdfExportService.exportServiceInvoicePdf(
                        invoice,
                        "Phí dịch vụ phát sinh",
                        "5%",
                        COMPANY_ADDR, COMPANY_PHONE, COMPANY_EMAIL,
                        null, null
                );

            } else if (isInstallationInvoice(invoice)) {
                Contract ct = invoice.getContract();
                String contractNumber = (ct != null) ? ct.getContractNumber() : "";
                // contractSignDate bạn đang dùng contract.startDate trong Notification
                pdfPath = invoicePdfExportService.exportInstallationInvoicePdf(
                        invoice,
                        contractNumber,
                        (ct != null ? ct.getStartDate() : null),
                        COMPANY_ADDR, COMPANY_PHONE, COMPANY_EMAIL,
                        null, null
                );

            } else {
                throw new ResourceNotFoundException("Không xác định được loại hóa đơn: " + invoice.getId());
            }

            if (pdfPath == null || pdfPath.isBlank()) {
                throw new ResourceNotFoundException("Export PDF thất bại cho hóa đơn: " + invoice.getId());
            }

            Path p = Path.of(pdfPath);
            byte[] bytes = Files.readAllBytes(p);

            // xóa file tạm để không rác (vì download luôn generate lại)
            try { Files.deleteIfExists(p); } catch (Exception ignore) {}

            return bytes;

        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("[InvoicePdfDownload] Generate fresh PDF failed invoiceId={}: {}", invoice.getId(), ex.getMessage(), ex);
            throw new RuntimeException("Lỗi tạo file PDF hóa đơn: " + ex.getMessage(), ex);
        }
    }
}