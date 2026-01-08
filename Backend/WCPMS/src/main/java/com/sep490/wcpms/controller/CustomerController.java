package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.InstallationDetailDTO;
import com.sep490.wcpms.security.services.UserDetailsImpl; // THAY TÊN ĐÚNG
import com.sep490.wcpms.service.CustomerService;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.service.impl.ContractPdfStampService;
import com.sep490.wcpms.service.impl.InvoicePdfDownloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customer") // API chung cho Khách hàng
@RequiredArgsConstructor
@CrossOrigin("*")
public class CustomerController {

    private final CustomerService customerService;
    private final ContractPdfStampService contractPdfStampService;
    private final InvoicePdfDownloadService invoicePdfDownloadService;

    // Hàm helper lấy ID user (Giả định đã có)
    private Integer getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl) { // SỬA TÊN NÀY
            return ((UserDetailsImpl) principal).getId(); // SỬA TÊN NÀY
        }
        throw new IllegalStateException("Cannot determine user ID from Principal.");
    }

    // ... (Các API cũ của Customer: /profile, /contract-request, ...)


    // === API MỚI CHO HÓA ĐƠN ===

    /**
     * API Lấy danh sách Hóa đơn của Khách hàng (Lọc theo status)
     * Path: GET /api/customer/invoices?status=PENDING,OVERDUE
     * Path: GET /api/customer/invoices?status=PAID
     */
    @GetMapping("/invoices")
    public ResponseEntity<Page<InvoiceDTO>> getMyInvoices(
            // Cho phép tham số 'status' được bỏ trống (null)
            @RequestParam(required = false) List<String> status, // Nhận 1 hoặc nhiều status
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "invoiceDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Integer customerAccountId = getAuthenticatedUserId();
        Page<InvoiceDTO> invoices = customerService.getMyInvoicesByStatus(customerAccountId, status, keyword, pageable);
        return ResponseEntity.ok(invoices);
    }

    /**
     * API Lấy CHI TIẾT 1 Hóa đơn (Xác thực đúng chủ)
     * Path: GET /api/customer/invoices/{invoiceId}
     */
    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceDTO> getMyInvoiceDetail(
            @PathVariable Integer invoiceId
    ) {
        Integer customerAccountId = getAuthenticatedUserId();
        InvoiceDTO invoice = customerService.getMyInvoiceDetail(customerAccountId, invoiceId);
        return ResponseEntity.ok(invoice);
    }
    // === HẾT PHẦN THÊM ===

    // --- THÊM API MỚI ---
    /**
     * API Lấy chi tiết 1 Bản ghi Lắp đặt (Bảng 13)
     * Path: GET /api/customer/installation/{installationId}
     */
    @GetMapping("/installation/{installationId}")
    public ResponseEntity<InstallationDetailDTO> getMyInstallationDetail(
            @PathVariable Integer installationId
    ) {
        Integer customerAccountId = getAuthenticatedUserId();
        InstallationDetailDTO detail = customerService.getMyInstallationDetail(customerAccountId, installationId);
        return ResponseEntity.ok(detail);
    }
    // ---

    // GET /api/customer/contracts/{contractId}/pdf
    @GetMapping("/contracts/{contractId}/pdf")
    public ResponseEntity<byte[]> downloadMyContractPdf(@PathVariable Integer contractId) {
        Integer customerAccountId = getAuthenticatedUserId();

        byte[] pdfBytes = contractPdfStampService.exportForCustomer(customerAccountId, contractId);

        String filename = "HopDong_" + contractId + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(pdfBytes);
    }

    /**
     * Tải PDF hóa đơn đã phát hành (Customer).
     * GET /api/customer/invoices/{invoiceId}/pdf
     */
    @GetMapping("/invoices/{invoiceId}/pdf")
    public ResponseEntity<byte[]> downloadMyInvoicePdf(@PathVariable Integer invoiceId) {
        Integer customerAccountId = getAuthenticatedUserId();

        InvoicePdfDownloadService.PdfResult pdf = invoicePdfDownloadService
                .downloadForCustomer(customerAccountId, invoiceId);

        String safeInvoiceNumber = (pdf.invoiceNumber() == null || pdf.invoiceNumber().isBlank())
                ? String.valueOf(invoiceId)
                : pdf.invoiceNumber();

        String filename = "HoaDon_" + safeInvoiceNumber + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(pdf.bytes());
    }
}