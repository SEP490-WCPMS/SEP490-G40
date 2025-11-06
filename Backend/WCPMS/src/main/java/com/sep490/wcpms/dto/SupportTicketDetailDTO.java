package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.CustomerFeedback;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO (Data Transfer Object) để hiển thị thông tin CHI TIẾT
 * của một Yêu cầu Hỗ trợ (Ticket) cho NV Kỹ thuật.
 */
@Data
public class SupportTicketDetailDTO {

    // --- Thông tin Ticket (Từ Bảng 20) ---
    private Integer id; // ID của ticket
    private String feedbackNumber; // Mã ticket
    private String description; // Nội dung (vd: "Đồng hồ... đến hạn kiểm định")
    private CustomerFeedback.FeedbackType feedbackType; // Loại (SUPPORT_REQUEST)
    private CustomerFeedback.Status status; // Trạng thái (IN_PROGRESS)
    private LocalDateTime submittedDate; // Ngày gửi

    // --- Thông tin Khách hàng (Từ Bảng 7) ---
    private Integer customerId;
    private String customerName;
    private String customerAddress;
    private String customerPhone; // <-- SĐT Khách hàng (Lấy từ Account)
    private String customerEmail; // <-- Email Khách hàng (Lấy từ Account)

    // --- Thông tin Hợp đồng Dịch vụ (Từ Bảng 9) ---
    private String serviceContractNumber; // Số HĐ Dịch vụ (HĐ-DV...)
    private String priceTypeName; // Loại giá (Sinh hoạt, Kinh doanh...)

    // --- Thông tin Đồng hồ (Từ Bảng 13 & 10) ---
    private String meterCode; // Mã đồng hồ (M001)
    private String meterSerialNumber; // Số serial

    // --- Thông tin NV Kỹ thuật (Từ Bảng 2) ---
    private Integer assignedToId; // ID của NV Kỹ thuật được gán
    private String assignedToName; // Tên NV Kỹ thuật
}