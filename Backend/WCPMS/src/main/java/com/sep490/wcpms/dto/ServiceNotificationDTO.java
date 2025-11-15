package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO thông báo realtime gửi tới Service Staff qua SSE.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceNotificationDTO {
    // ID thông báo trong DB (có thể null nếu broadcast multi-receiver như CONTRACT_REQUEST_CREATED)
    private Long id;
    /** Loại sự kiện, ví dụ: TECH_SURVEY_COMPLETED, CUSTOMER_SIGNED, INSTALLATION_SCHEDULED */
    private String type;
    /** Nội dung hiển thị ngắn gọn cho người dùng */
    private String message;
    /** Thời điểm backend phát sự kiện */
    private LocalDateTime timestamp = LocalDateTime.now();
    /** ID hợp đồng liên quan (nếu có) */
    private Integer contractId;
    /** Dữ liệu mở rộng (tùy chọn) cho FE nếu cần thêm context) */
    private Map<String, Object> extra;
}
