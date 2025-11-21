package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.dto.CalibrationFeeDTO;
import com.sep490.wcpms.dto.AccountingInvoiceDetailDTO;
import com.sep490.wcpms.dto.InvoiceDTO; // <-- Cần tạo DTO này
import com.sep490.wcpms.dto.ServiceInvoiceCreateDTO;
import com.sep490.wcpms.dto.dashboard.AccountingStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;
import com.sep490.wcpms.entity.ReadingRoute;
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

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách HĐ ACTIVE chưa có hóa đơn lắp đặt (CONTRACT invoice).
     */
    Page<ContractDTO> getActiveContractsWithoutInstallationInvoice(Pageable pageable);

    /**
     * Tạo Hóa đơn lắp đặt cho 1 Hợp đồng ACTIVE.
     */
    InvoiceDTO createInstallationInvoice(ContractInstallationInvoiceCreateDTO request, Integer staffId);

    /**
     * Lấy danh sách các chỉ số đã đọc (COMPLETED) và chờ lập hóa đơn.
     */
    Page<PendingReadingDTO> getPendingReadings(Pageable pageable);

    /**
     * Tạo Hóa đơn tiền nước (Bảng 17) từ một bản ghi MeterReading (Bảng 15).
     */
    InvoiceDTO generateWaterBill(Integer meterReadingId, Integer accountingStaffId);

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

    // --- SỬA LẠI CÁC HÀM NÀY ---

    /** Lấy tất cả các Tuyến đọc (Bảng 4) (Giữ nguyên) */
    List<ReadingRouteDTO> getAllRoutes();

    /** (XÓA HÀM getUnassignedContracts()) */

    /** Lấy danh sách HĐ (Bảng 9) ĐÃ GÁN vào 1 tuyến (Đã sắp xếp) */
    List<RouteManagementDTO> getContractsByRoute(Integer routeId);

    /** Cập nhật Thứ tự (Drag-and-Drop) */
    void updateRouteOrder(Integer routeId, RouteOrderUpdateRequestDTO dto);

    // --- HẾT PHẦN SỬA ---
    /** Tính toán chi tiết tiền nước (Xem trước) */
    WaterBillCalculationDTO calculateWaterBill(Integer meterReadingId);
}