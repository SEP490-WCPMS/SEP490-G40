package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người nhận thông báo: FK tới accounts.id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_account_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_notifications_accounts"))
    private Account receiverAccount;

    // Tiêu đề thông báo
    @Column(name = "title")
    private String title;

    // Nội dung thông báo chi tiết
    @Lob
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    // Loại thông báo: SYSTEM, CONTRACT, INVOICE, MAINTENANCE, PAYMENT, SUPPORT
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private NotificationType type;

    // ID đối tượng liên quan (hóa đơn/hợp đồng/ticket/...)
    @Column(name = "reference_id")
    private Long referenceId;

    // Loại đối tượng liên quan: INVOICE, CONTRACT, TICKET, METER, NONE
    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 20)
    private ReferenceType referenceType;

    // Trạng thái đã đọc hay chưa
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    // Thời điểm đánh dấu đã đọc (nếu có)
    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Thời điểm tạo (mặc định CURRENT_TIMESTAMP)
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        SYSTEM, CONTRACT, INVOICE, MAINTENANCE, PAYMENT, SUPPORT
    }

    public enum ReferenceType {
        INVOICE, CONTRACT, TICKET, METER, NONE
    }
}
