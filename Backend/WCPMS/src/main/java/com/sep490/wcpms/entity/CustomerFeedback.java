package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "feedback_number", length = 50, unique = true, nullable = false)
    private String feedbackNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_customer_feedback_customers"))
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_type", length = 20, nullable = false)
    private FeedbackType feedbackType = FeedbackType.FEEDBACK;

    @Lob
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "submitted_date")
    private LocalDateTime submittedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @Lob
    @Column(name = "response", columnDefinition = "TEXT")
    private String response;

    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to",
            foreignKey = @ForeignKey(name = "fk_customer_feedback_assigned_to"))
    private Account assignedTo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum FeedbackType {
        FEEDBACK,           // Gợi ý cải thiện
        SUPPORT_REQUEST     // Khiếu nại/Hỗ trợ
    }

    public enum FeedbackStatus {
        PENDING,       // Chờ xử lý
        IN_PROGRESS,   // Đang xử lý
        RESOLVED       // Đã giải quyết
    }
}

