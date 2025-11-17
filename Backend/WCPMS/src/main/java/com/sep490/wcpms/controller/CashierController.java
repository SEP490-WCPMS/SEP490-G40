package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CashierContractDetailDTO;
import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.ReceiptDTO;
import com.sep490.wcpms.dto.RouteManagementDTO;
import com.sep490.wcpms.dto.ReadingRouteDTO;
import com.sep490.wcpms.dto.dashboard.CashierDashboardStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyReadingCountDTO;
import com.sep490.wcpms.security.services.UserDetailsImpl; // THAY TÊN ĐÚNG
import com.sep490.wcpms.service.CashierService;
import com.sep490.wcpms.exception.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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

    // === SỬA LẠI CÁC API GHI CHỈ SỐ ===

    /**
     * (Mới - Req 1) API Lấy danh sách Tuyến (Routes) MÀ TÔI được gán
     * Path: GET /api/cashier/my-assigned-routes
     */
    @GetMapping("/my-assigned-routes")
    public ResponseEntity<List<ReadingRouteDTO>> getMyAssignedRoutes() {
        Integer cashierId = getAuthenticatedStaffId();
        List<ReadingRouteDTO> routes = cashierService.getMyAssignedRoutes(cashierId);
        return ResponseEntity.ok(routes);
    }

    /**
     * (Sửa - Req 1) API Lấy danh sách Hợp đồng/Khách hàng (Đã sắp xếp)
     * theo MỘT Tuyến (routeId) CỤ THỂ.
     * Path: GET /api/cashier/route/{routeId}/contracts
     */
    @GetMapping("/route/{routeId}/contracts")
    public ResponseEntity<List<RouteManagementDTO>> getMyContractsByRoute(
            @PathVariable Integer routeId
    ) {
        Integer cashierId = getAuthenticatedStaffId();
        List<RouteManagementDTO> contracts = cashierService.getMyContractsByRoute(cashierId, routeId);
        return ResponseEntity.ok(contracts);
    }

    /**
     * (Mới - Req 3) API Lấy Chi tiết 1 Hợp đồng (xác thực theo tuyến).
     * Path: GET /api/cashier/route/contract-detail/{contractId}
     */
    @GetMapping("/route/contract-detail/{contractId}")
    public ResponseEntity<CashierContractDetailDTO> getCashierContractDetail(
            @PathVariable Integer contractId
    ) {
        Integer cashierId = getAuthenticatedStaffId();
        CashierContractDetailDTO detail = cashierService.getCashierContractDetail(cashierId, contractId);
        return ResponseEntity.ok(detail);
    }
    // === HẾT PHẦN SỬA ===

    // --- THÊM API CÒN THIẾU (CHO DASHBOARD) ---
    /**
     * API Lấy danh sách Hợp đồng/Khách hàng (Đã sắp xếp)
     * theo TẤT CẢ các tuyến của Thu ngân.
     * (Dùng cho Bảng "Việc cần làm" trên Dashboard)
     * Path: GET /api/cashier/my-route-contracts
     */
    @GetMapping("/my-route-contracts")
    public ResponseEntity<List<RouteManagementDTO>> getMyRouteContracts() {
        Integer cashierId = getAuthenticatedStaffId();
        // (Hàm này đã có trong CashierServiceImpl)
        List<RouteManagementDTO> contracts = cashierService.getMyRouteContracts(cashierId);
        return ResponseEntity.ok(contracts);
    }
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 API MỚI ---

    /**
     * API Lấy Thẻ Thống kê (KPIs) cho Dashboard Thu ngân.
     * Path: GET /api/cashier/dashboard/stats
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<CashierDashboardStatsDTO> getDashboardStats() {
        Integer cashierId = getAuthenticatedStaffId();
        CashierDashboardStatsDTO stats = cashierService.getDashboardStats(cashierId);
        return ResponseEntity.ok(stats);
    }

    /**
     * API Lấy dữ liệu Biểu đồ Ghi số.
     * Path: GET /api/cashier/dashboard/reading-chart?startDate=...&endDate=...
     */
    @GetMapping("/dashboard/reading-chart")
    public ResponseEntity<List<DailyReadingCountDTO>> getReadingChartData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        Integer cashierId = getAuthenticatedStaffId();
        List<DailyReadingCountDTO> report = cashierService.getReadingChartData(cashierId, startDate, endDate);
        return ResponseEntity.ok(report);
    }
    // --- HẾT PHẦN THÊM ---
}