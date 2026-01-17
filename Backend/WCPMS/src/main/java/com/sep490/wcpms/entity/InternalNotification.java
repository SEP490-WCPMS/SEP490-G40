package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "internal_notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InternalNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer recipientId;   // Null nếu gửi cho cả nhóm Role
    private String recipientRole;  // Null nếu gửi cho 1 người cụ thể

    private String title;

    @Lob
    private String message;

    private Integer referenceId; // ID hợp đồng để click vào điều hướng tới

    @Enumerated(EnumType.STRING)
    private NotificationType referenceType;

    private boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // ENUM trạng thái thông báo
    public enum NotificationType {
        // 1. Admin: Kỹ thuật duyệt xong -> Báo tạo account
        GUEST_NEEDS_ACCOUNT,

        // 2. Admin: Dịch vụ tạo HĐ nước -> Báo tạo account (nếu chưa có)
        GUEST_CONTRACT_CREATED,

        // 3. Service Staff: Admin đã tạo acc xong -> Báo gửi ký
        GUEST_ACCOUNT_CREATED
    }
}