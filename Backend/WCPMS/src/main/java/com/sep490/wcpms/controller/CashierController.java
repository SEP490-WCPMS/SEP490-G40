package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.ReceiptDTO;
import com.sep490.wcpms.security.services.UserDetailsImpl; // THAY TÊN ĐÚNG
import com.sep490.wcpms.service.CashierService;
import com.sep490.wcpms.exception.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/cashier") // API chung cho Thu ngân
@RequiredArgsConstructor
@CrossOrigin("*")
public class CashierController {

    private final CashierService cashierService;

    // Hàm helper lấy ID user (Giả định đã có)
    private Integer getAuthenticatedStaffId() {
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

    /**
     * API Tìm Hóa đơn (PENDING/OVERDUE) theo Mã Hóa đơn.
     * Path: GET /api/cashier/invoices/search/{invoiceNumber}
     */
    @GetMapping("/invoices/search/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> findUnpaidInvoice(@PathVariable String invoiceNumber) {
        InvoiceDTO invoice = cashierService.findUnpaidInvoice(invoiceNumber);
        return ResponseEntity.ok(invoice);
    }

    /**
     * API Xử lý Thanh toán Tiền mặt.
     * Path: POST /api/cashier/invoices/{invoiceId}/pay-cash
     * Body: { "amountPaid": 123456 }
     */
    @PostMapping("/invoices/{invoiceId}/pay-cash")
    public ResponseEntity<ReceiptDTO> processCashPayment(
            @PathVariable Integer invoiceId,
            @RequestBody Map<String, BigDecimal> payload
    ) {
        Integer cashierId = getAuthenticatedStaffId();
        BigDecimal amountPaid = payload.get("amountPaid");

        if (amountPaid == null) {
            throw new IllegalArgumentException("Missing 'amountPaid' in request body.");
        }

        ReceiptDTO receipt = cashierService.processCashPayment(invoiceId, cashierId, amountPaid);
        return ResponseEntity.ok(receipt);
    }

    // --- THÊM 2 API MỚI (Thu tại nhà) ---

    /**
     * API Lấy danh sách Hóa đơn (PENDING/OVERDUE) theo tuyến của Thu ngân.
     * Path: GET /api/cashier/my-route-invoices
     */
    @GetMapping("/my-route-invoices")
    public ResponseEntity<Page<InvoiceDTO>> getMyRouteInvoices(
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Integer cashierId = getAuthenticatedStaffId();
        Page<InvoiceDTO> invoices = cashierService.getInvoicesByMyRoutes(cashierId, pageable);
        return ResponseEntity.ok(invoices);
    }

    /**
     * API Lấy chi tiết 1 Hóa đơn (xác thực theo tuyến).
     * Path: GET /api/cashier/invoices/{invoiceId}
     */
    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceDTO> getCashierInvoiceDetail(
            @PathVariable Integer invoiceId
    ) {
        Integer cashierId = getAuthenticatedStaffId();
        InvoiceDTO invoice = cashierService.getCashierInvoiceDetail(cashierId, invoiceId);
        return ResponseEntity.ok(invoice);
    }
    // --- HẾT PHẦN THÊM ---
}