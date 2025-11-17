package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.dto.dashboard.CashierDashboardStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyReadingCountDTO;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface CashierService {

    // === Thu tại quầy (Đã code) ===
    /**
     * Tìm một Hóa đơn (Inovice) CHƯA THANH TOÁN (Pending/Overdue)
     * bằng Số hóa đơn.
     * Dùng cho NV Thu ngân khi Khách hàng đem HĐ đến quầy.
     */
    InvoiceDTO findUnpaidInvoice(String invoiceNumber);

    /**
     * Xử lý thanh toán Tiền mặt (CASH) cho một Hóa đơn.
     * Cập nhật Invoice (Bảng 17) sang PAID.
     * Tạo Biên lai (Receipt - Bảng 19).
     */
    ReceiptDTO processCashPayment(Integer invoiceId, Integer cashierId, BigDecimal amountPaid);

    // === THÊM 2 HÀM MỚI (Thu tại nhà) ===

    /**
     * Lấy danh sách Hóa đơn PENDING/OVERDUE
     * thuộc các tuyến (Routes) mà Thu ngân này quản lý.
     */
    Page<InvoiceDTO> getInvoicesByMyRoutes(Integer cashierId, Pageable pageable);

    /**
     * Lấy chi tiết 1 Hóa đơn (xác thực Thu ngân có quyền xem).
     */
    InvoiceDTO getCashierInvoiceDetail(Integer cashierId, Integer invoiceId);

    // === THÊM/SỬA (Luồng Ghi Chỉ Số) ===

    /**
     * (Mới - Req 1) Lấy danh sách các Tuyến đọc (Bảng 4)
     * mà Thu ngân này được gán.
     */
    List<ReadingRouteDTO> getMyAssignedRoutes(Integer cashierId);

    /**
     * (Sửa - Req 1) Lấy danh sách HĐ (đã sắp xếp)
     * thuộc 1 Tuyến (routeId) CỤ THỂ mà Thu ngân quản lý.
     */
    List<RouteManagementDTO> getMyContractsByRoute(Integer cashierId, Integer routeId);

    /**
     * (Mới - Req 3) Lấy Chi tiết 1 Hợp đồng (xác thực theo tuyến).
     */
    CashierContractDetailDTO getCashierContractDetail(Integer cashierId, Integer contractId);

    // --- THÊM HÀM CÒN THIẾU VÀO ĐÂY ---
    /**
     * Lấy danh sách Hợp đồng/Khách hàng (Đã sắp xếp)
     * theo TẤT CẢ các tuyến của Thu ngân.
     * (Dùng cho Bảng "Việc cần làm" trên Dashboard)
     */
    List<RouteManagementDTO> getMyRouteContracts(Integer cashierId);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 HÀM MỚI ---
    /**
     * Lấy các chỉ số KPI cho Thẻ Thống kê (Stats Cards).
     */
    CashierDashboardStatsDTO getDashboardStats(Integer cashierId);

    /**
     * Lấy dữ liệu Biểu đồ Ghi số.
     */
    List<DailyReadingCountDTO> getReadingChartData(Integer cashierId, LocalDate startDate, LocalDate endDate);
    // --- HẾT PHẦN THÊM ---
}