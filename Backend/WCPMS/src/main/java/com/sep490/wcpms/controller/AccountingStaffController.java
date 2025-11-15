package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CalibrationFeeDTO;
import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import com.sep490.wcpms.service.AccountingStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import com.sep490.wcpms.dto.ServiceInvoiceCreateDTO;
import com.sep490.wcpms.dto.AccountingInvoiceDetailDTO;
import com.sep490.wcpms.dto.dashboard.AccountingStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounting")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AccountingStaffController {

    private final AccountingStaffService accountingService;

    // Hàm helper lấy ID user (Giả định đã có)
    private Integer getAuthenticatedStaffId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // ... (Logic lấy UserDetailsImpl và .getId() giống các Controller khác)
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }

    /**
     * API Lấy danh sách Phí Kiểm định CHƯA LẬP HÓA ĐƠN.
     * Path: GET /api/accounting/unbilled-calibrations
     */
    @GetMapping("/unbilled-calibrations")
    public ResponseEntity<Page<CalibrationFeeDTO>> getUnbilledCalibrationFees(
            @PageableDefault(size = 10, sort = "calibrationDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<CalibrationFeeDTO> fees = accountingService.getUnbilledCalibrationFees(pageable);
        return ResponseEntity.ok(fees);
    }

    // --- THÊM API MỚI (Req 1) ---
    /**
     * API Lấy CHI TIẾT 1 Phí Kiểm định.
     * Path: GET /api/accounting/unbilled-calibrations/{calibrationId}
     */
    @GetMapping("/unbilled-calibrations/{calibrationId}")
    public ResponseEntity<CalibrationFeeDTO> getUnbilledFeeDetail(
            @PathVariable Integer calibrationId
    ) {
        CalibrationFeeDTO feeDetail = accountingService.getUnbilledFeeDetail(calibrationId);
        return ResponseEntity.ok(feeDetail);
    }
    // ---

    // --- SỬA LẠI API NÀY ---
    /**
     * API Tạo Hóa đơn Dịch vụ TỪ DỮ LIỆU ĐÃ CHỈNH SỬA.
     * Path: POST /api/accounting/create-invoice
     */
    @PostMapping("/create-invoice")
    public ResponseEntity<InvoiceDTO> createServiceInvoice(
            @RequestBody ServiceInvoiceCreateDTO invoiceDto // <-- Nhận DTO mới
    ) {
        Integer accountingStaffId = getAuthenticatedStaffId();
        // Gọi hàm service đã sửa
        InvoiceDTO invoice = accountingService.createServiceInvoice(invoiceDto, accountingStaffId);
        return new ResponseEntity<>(invoice, HttpStatus.CREATED);
    }
    // --- HẾT PHẦN SỬA ---

    // --- THÊM 2 API MỚI (Req 3, 4, 5) ---

    /**
     * API Lấy danh sách Hóa đơn (Đã tạo), có lọc.
     * Path: GET /api/accounting/invoices?status=PENDING&page=0
     */
    @GetMapping("/invoices")
    public ResponseEntity<Page<InvoiceDTO>> getInvoices(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(size = 10, sort = "invoiceDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<InvoiceDTO> invoices = accountingService.getInvoices(status, pageable);
        return ResponseEntity.ok(invoices);
    }

    /**
     * API Lấy CHI TIẾT 1 Hóa đơn đã tạo.
     * Path: GET /api/accounting/invoices/{invoiceId}
     */
    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<AccountingInvoiceDetailDTO> getInvoiceDetail(
            @PathVariable Integer invoiceId
    ) {
        AccountingInvoiceDetailDTO detail = accountingService.getInvoiceDetail(invoiceId);
        return ResponseEntity.ok(detail);
    }

    /**
     * API Hủy 1 Hóa đơn Dịch vụ (Chuyển sang CANCELLED)
     * Path: PUT /api/accounting/invoices/{invoiceId}/cancel
     */
    @PutMapping("/invoices/{invoiceId}/cancel")
    public ResponseEntity<InvoiceDTO> cancelInvoice(
            @PathVariable Integer invoiceId
    ) {
        Integer staffId = getAuthenticatedStaffId();
        InvoiceDTO cancelledInvoice = accountingService.cancelInvoice(invoiceId, staffId);
        return ResponseEntity.ok(cancelledInvoice);
    }
    // --- HẾT PHẦN THÊM ---

    // --- THÊM API MỚI ---
    /**
     * API Lấy Thẻ Thống kê (KPIs) cho Dashboard.
     * Path: GET /api/accounting/dashboard/stats
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<AccountingStatsDTO> getDashboardStats() {
        AccountingStatsDTO stats = accountingService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
    // ---

    // --- THÊM API MỚI ---
    /**
     * API Lấy dữ liệu Doanh thu cho Biểu đồ Dashboard.
     * Path: GET /api/accounting/dashboard/revenue-report?startDate=...&endDate=...
     */
    @GetMapping("/dashboard/revenue-report")
    public ResponseEntity<List<DailyRevenueDTO>> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<DailyRevenueDTO> report = accountingService.getRevenueReport(startDate, endDate);
        return ResponseEntity.ok(report);
    }
    // --- HẾT PHẦN THÊM ---
}