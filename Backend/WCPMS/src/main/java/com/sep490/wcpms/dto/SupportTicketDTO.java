package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.CustomerFeedback;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO (Data Transfer Object) để hiển thị thông tin Yêu cầu Hỗ trợ (Ticket)
 * cho Service Staff và Technical Staff.
 */
@Data
public class SupportTicketDTO {

    private Integer id; // ID của ticket (Bảng 20)
    private String feedbackNumber; // Mã ticket (vd: CAL-1-2025)

    // Thông tin khách hàng
    private Integer customerId;
    private String customerName;
    private String customerAddress;

    // Thông tin ticket
    private String description; // Nội dung (vd: "Đồng hồ... đến hạn kiểm định")
    private CustomerFeedback.FeedbackType feedbackType; // Loại (SUPPORT_REQUEST)
    private CustomerFeedback.Status status; // Trạng thái (PENDING, IN_PROGRESS)
    private LocalDateTime submittedDate;

    // Thông tin người gán / người xử lý
    private Integer assignedToId; // ID của NV Kỹ thuật được gán
    private String assignedToName; // Tên NV Kỹ thuật

    // --- THÊM 2 TRƯỜNG BỊ THIẾU ---
    /**
     * Nội dung phản hồi của NV Dịch vụ (Lấy từ Bảng 20)
     */
    private String response;

    /**
     * Ngày giải quyết/phản hồi
     */
    private LocalDateTime resolvedDate;
    // --- HẾT PHẦN THÊM ---
}
