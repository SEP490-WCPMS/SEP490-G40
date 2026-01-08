package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.Optional;

/**
 * Tải file PDF hóa đơn đã được export sẵn sau khi kế toán phát hành.
 *
 * - Customer: chỉ tải được hóa đơn thuộc customer đang đăng nhập.
 * - Accounting staff: chỉ tải được hóa đơn được phân công cho staff đó.
 *
 * Lưu ý: Service này KHÔNG tạo lại PDF. Chỉ đọc file đã có.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicePdfDownloadService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final CustomerNotificationRepository customerNotificationRepository;

    public record PdfResult(String invoiceNumber, byte[] bytes) {}

    public PdfResult downloadForCustomer(Integer customerAccountId, Integer invoiceId) {
        Customer customer = customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng của account: " + customerAccountId));

        Invoice invoice = invoiceRepository.findByIdAndCustomer(invoiceId, customer)
                .orElseThrow(() -> new AccessDeniedException("Bạn không có quyền truy cập hóa đơn: " + invoiceId));

        return new PdfResult(invoice.getInvoiceNumber(), loadPdfBytes(invoice));
    }

    public PdfResult downloadForAccounting(Integer accountingStaffId, Integer invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndAccountingStaff_Id(invoiceId, accountingStaffId)
                .orElseThrow(() -> new AccessDeniedException("Hóa đơn không thuộc nhân viên kế toán này hoặc không tồn tại: " + invoiceId));

        return new PdfResult(invoice.getInvoiceNumber(), loadPdfBytes(invoice));
    }

    private byte[] loadPdfBytes(Invoice invoice) {
        if (invoice == null) {
            throw new ResourceNotFoundException("Invoice null");
        }

        // 1) Ưu tiên lấy đường dẫn PDF đã lưu trong CustomerNotification.attachmentUrl
        String pdfPath = null;
        try {
            CustomerNotification lastWithPdf = customerNotificationRepository
                    .findTop1ByInvoiceAndAttachmentUrlIsNotNullOrderByCreatedAtDesc(invoice);
            if (lastWithPdf != null) {
                pdfPath = lastWithPdf.getAttachmentUrl();
            }
        } catch (Exception ex) {
            // không fail ở đây, fallback xuống dưới
            log.warn("[InvoicePdfDownload] Cannot load attachmentUrl from notification for invoiceId={}: {}",
                    invoice.getId(), ex.getMessage());
        }

        // 2) Fallback: tìm file trong invoices-pdf theo invoiceNumber
        if (pdfPath == null || pdfPath.isBlank()) {
            pdfPath = findLatestPdfByInvoiceNumber(invoice.getInvoiceNumber()).orElse(null);
        }

        if (pdfPath == null || pdfPath.isBlank()) {
            throw new ResourceNotFoundException("Không tìm thấy file PDF cho hóa đơn: " + invoice.getId());
        }

        try {
            Path path = Paths.get(pdfPath);
            if (!path.isAbsolute()) {
                // resolve theo working dir hiện tại của server
                path = Paths.get("").toAbsolutePath().resolve(path).normalize();
            }

            if (!Files.exists(path)) {
                throw new ResourceNotFoundException("File PDF không tồn tại: " + path);
            }

            return Files.readAllBytes(path);
        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new RuntimeException("Lỗi đọc file PDF hóa đơn: " + ex.getMessage(), ex);
        }
    }

    private Optional<String> findLatestPdfByInvoiceNumber(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.isBlank()) {
            return Optional.empty();
        }

        File dir = new File("invoices-pdf");
        if (!dir.exists() || !dir.isDirectory()) {
            return Optional.empty();
        }

        File[] matches = dir.listFiles((d, name) ->
                name != null
                        && name.toLowerCase().endsWith(".pdf")
                        && name.contains(invoiceNumber)
        );

        if (matches == null || matches.length == 0) {
            return Optional.empty();
        }

        return java.util.Arrays.stream(matches)
                .max(Comparator.comparingLong(File::lastModified))
                .map(f -> "invoices-pdf/" + f.getName());
    }
}