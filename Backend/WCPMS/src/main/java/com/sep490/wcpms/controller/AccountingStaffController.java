package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.security.services.UserDetailsImpl; // THAY TÊN ĐÚNG
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
import org.springframework.web.bind.annotation.GetMapping; // <-- THÊM
import org.springframework.web.bind.annotation.PutMapping; // <-- THÊM


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

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách HĐ ACTIVE chưa có hóa đơn lắp đặt.
     * GET /api/accounting/contracts/eligible-installation
     */
    @GetMapping("/contracts/eligible-installation")
    public ResponseEntity<Page<ContractDTO>> getEligibleInstallationContracts(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ContractDTO> result = accountingService.getActiveContractsWithoutInstallationInvoice(pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * Tạo hóa đơn lắp đặt (CONTRACT invoice) cho 1 Hợp đồng ACTIVE.
     * POST /api/accounting/invoices/installation
     * Body:
     * {
     *   "contractId": 3,
     *   "invoiceNumber": "CN-2025-0001", // backend tự sinh
     *   "invoiceDate": "2025-11-13",
     *   "dueDate": "2025-11-28",
     *   "subtotalAmount": 5000000,
     *   "vatAmount": 500000,
     *   "totalAmount": 5500000
     * }
     */
    @PostMapping("/invoices/installation")
    public ResponseEntity<InvoiceDTO> createInstallationInvoice(
            @RequestBody ContractInstallationInvoiceCreateDTO body
    ) {
        Integer staffId = getAuthenticatedStaffId();
        InvoiceDTO dto = accountingService.createInstallationInvoice(body, staffId);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    // --- HẾT HÀM THÊM ---
}