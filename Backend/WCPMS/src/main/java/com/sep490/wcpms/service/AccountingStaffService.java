package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CalibrationFeeDTO;
import com.sep490.wcpms.dto.AccountingInvoiceDetailDTO;
import com.sep490.wcpms.dto.InvoiceDTO; // <-- Cần tạo DTO này
import com.sep490.wcpms.dto.ServiceInvoiceCreateDTO;
import com.sep490.wcpms.dto.dashboard.AccountingStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.sep490.wcpms.dto.*;
import java.time.LocalDate;
import java.util.List;

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

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy các chỉ số KPI cho Thẻ Thống kê (Stats Cards).
     */
    AccountingStatsDTO getDashboardStats();
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy dữ liệu Báo cáo Doanh thu cho Dashboard.
     */
    List<DailyRevenueDTO> getRevenueReport(LocalDate startDate, LocalDate endDate);
    // --- HẾT PHẦN THÊM ---
}