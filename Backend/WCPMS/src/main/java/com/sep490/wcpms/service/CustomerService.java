package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.InvoiceDTO; // <-- THÊM IMPORT
import com.sep490.wcpms.dto.InstallationDetailDTO;
import com.sep490.wcpms.dto.ContractRequestDTO;
// ... (các import DTO khác)
import org.springframework.data.domain.Page; // <-- THÊM IMPORT
import org.springframework.data.domain.Pageable; // <-- THÊM IMPORT
import java.util.List; // <-- THÊM IMPORT

public interface CustomerService {

    // ... (Các hàm cũ: requestNewContract, getMyContracts, ...)

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách Hóa đơn của Khách hàng (lọc theo List Status).
     * @param customerAccountId ID tài khoản của Khách hàng (từ token)
     * @param statuses Danh sách trạng thái (PENDING, PAID...)
     * @param pageable Phân trang
     */
    Page<InvoiceDTO> getMyInvoicesByStatus(Integer customerAccountId, List<String> statuses, Pageable pageable);

    /**
     * Lấy chi tiết 1 Hóa đơn (xác thực đúng chủ sở hữu).
     * @param customerAccountId ID tài khoản của Khách hàng (từ token)
     * @param invoiceId ID của Hóa đơn (Bảng 17)
     */
    InvoiceDTO getMyInvoiceDetail(Integer customerAccountId, Integer invoiceId);

    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /** Lấy chi tiết (ảnh) của 1 bản ghi Lắp đặt (Bảng 13) */
    InstallationDetailDTO getMyInstallationDetail(Integer customerAccountId, Integer installationId);
    // ---
}