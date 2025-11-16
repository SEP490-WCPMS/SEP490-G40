package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.ReceiptDTO;
import com.sep490.wcpms.dto.RouteManagementDTO;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import java.math.BigDecimal;
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

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy danh sách Hợp đồng/Khách hàng
     * thuộc các tuyến (Routes) mà Thu ngân này quản lý,
     * đã được SẮP XẾP theo route_order.
     */
    List<RouteManagementDTO> getMyRouteContracts(Integer cashierId);
    // --- HẾT PHẦN THÊM ---
}