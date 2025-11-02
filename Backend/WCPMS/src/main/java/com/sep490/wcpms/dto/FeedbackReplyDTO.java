package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class FeedbackReplyDTO {
    @NotEmpty(message = "Nội dung trả lời không được để trống")
    private String responseContent; // Nội dung trả lời
}
