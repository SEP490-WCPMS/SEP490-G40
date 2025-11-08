package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.FeedbackCreateRequestDTO;
import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.dto.CustomerMeterDTO;
import org.springframework.data.domain.Page; // <-- THÊM IMPORT
import org.springframework.data.domain.Pageable; // <-- THÊM IMPORT
import java.util.List;

public interface CustomerFeedbackService {

    /**
     * Khách hàng (CUSTOMER) tự tạo một Yêu cầu Hỗ trợ (Báo hỏng).
     * @param dto DTO chứa nội dung.
     * @param customerAccountId ID tài khoản của khách hàng (lấy từ Security).
     * @return SupportTicketDTO
     */
    SupportTicketDTO createTicketAsCustomer(FeedbackCreateRequestDTO dto, Integer customerAccountId);

    /**
     * NV Dịch vụ (SERVICE_STAFF) tạo Yêu cầu Hỗ trợ hộ khách hàng.
     * @param dto DTO chứa nội dung VÀ customerId.
     * @param serviceStaffId ID của NV Dịch vụ (lấy từ Security).
     * @return SupportTicketDTO
     */
    SupportTicketDTO createTicketAsServiceStaff(FeedbackCreateRequestDTO dto, Integer serviceStaffId);

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách ticket (phân trang) của Khách hàng đang đăng nhập.
     */
    Page<SupportTicketDTO> getMyTickets(Integer customerAccountId, Pageable pageable);

    /**
     * Lấy chi tiết 1 ticket, xác thực đúng là của Khách hàng đang đăng nhập.
     */
    SupportTicketDTO getMyTicketDetail(Integer customerAccountId, Integer ticketId);

    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy danh sách đồng hồ đang hoạt động (ACTIVE/INSTALLED)
     * của Khách hàng đang đăng nhập.
     */
    List<CustomerMeterDTO> getCustomerActiveMeters(Integer customerAccountId);
    // --- HẾT PHẦN THÊM ---
}
