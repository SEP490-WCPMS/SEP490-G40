package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.FeedbackCreateRequestDTO;
import com.sep490.wcpms.dto.SupportTicketDTO;

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
}
