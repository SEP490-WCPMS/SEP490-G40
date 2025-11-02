package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.CustomerFeedback;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class FeedbackCreateRequestDTO {

    // Dùng cho "Cách B" (Service Staff tạo hộ)
    // Sẽ là null nếu là "Cách A" (Customer tự tạo)
    private Integer customerId;

    @NotEmpty(message = "Nội dung không được để trống")
    private String description; // Nội dung báo hỏng/yêu cầu

    // (FeedbackType sẽ được set cứng là SUPPORT_REQUEST trong service)
}
