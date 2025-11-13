package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AccountingStaffService {

    /**
     * Lấy danh sách các khoản phí kiểm định chưa được lập hóa đơn (treo).
     */
    Page<CalibrationFeeDTO> getUnbilledCalibrationFees(Pageable pageable);

    // --- SỬA LẠI HÀM NÀY ---
    /**
     * Tạo Hóa đơn Dịch vụ (Bảng 17) dựa trên DTO đã được Kế toán chỉnh sửa.
     */
    InvoiceDTO createServiceInvoice(ServiceInvoiceCreateDTO invoiceDto, Integer accountingStaffId);
    // --- HẾT PHẦN SỬA ---

    // --- THÊM 3 HÀM MỚI ---

    /**
     * Lấy chi tiết 1 khoản phí kiểm định "treo" (Req 1)
     */
    CalibrationFeeDTO getUnbilledFeeDetail(Integer calibrationId);

    /**
     * Lấy danh sách Hóa đơn (đã tạo) có lọc theo Status (Req 3+4)
     * @param status (PENDING, PAID, ...) hoặc "ALL"
     */
    Page<InvoiceDTO> getInvoices(String status, Pageable pageable);

    /**
     * (Mới) Lấy CHI TIẾT Hóa đơn (bao gồm Phí gốc).
     */
    AccountingInvoiceDetailDTO getInvoiceDetail(Integer invoiceId);

    /**
     * Hủy một Hóa đơn (PENDING -> CANCELLED) (Req 5)
     */
    InvoiceDTO cancelInvoice(Integer invoiceId, Integer staffId);

    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách HĐ ACTIVE chưa có hóa đơn lắp đặt (CONTRACT invoice).
     */
    Page<ContractDTO> getActiveContractsWithoutInstallationInvoice(Pageable pageable);

    /**
     * Tạo Hóa đơn lắp đặt cho 1 Hợp đồng ACTIVE.
     */
    InvoiceDTO createInstallationInvoice(ContractInstallationInvoiceCreateDTO request, Integer staffId);

    // --- HẾT PHẦN THÊM ---
}