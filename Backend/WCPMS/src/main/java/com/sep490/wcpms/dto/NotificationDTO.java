package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về lịch sử thông báo cho FE (Hybrid: localStorage + DB sync)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type; // SYSTEM, CONTRACT, ...
    private Long referenceId;
    private String referenceType; // CONTRACT, INVOICE, ...
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}

