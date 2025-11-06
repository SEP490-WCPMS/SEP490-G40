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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_type")
    private FeedbackType feedbackType = FeedbackType.FEEDBACK;


    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "submitted_date")
    private LocalDateTime submittedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.PENDING;

    @Lob
    @Column(name = "response", columnDefinition = "TEXT")
    private String response;

    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to") // Có thể là Service Staff hoặc Technical Staff
    private Account assignedTo;

    // --- THÊM TRƯỜNG NÀY VÀO ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", // Khớp với tên cột SQL
            foreignKey = @ForeignKey(name = "fk_feedback_requested_by")) // Thêm tên FK
    private Account requestedBy; // Người tạo ticket (Customer hoặc Service Staff)
    // --- HẾT PHẦN THÊM ---

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- THÊM TRƯỜNG MỚI ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", // Khớp với tên cột SQL
            foreignKey = @ForeignKey(name = "fk_feedback_water_meters"))
    private WaterMeter waterMeter; // Đồng hồ (Bảng 12) liên quan
    // --- HẾT PHẦN THÊM ---

    public enum FeedbackType {
        FEEDBACK,
        SUPPORT_REQUEST // Yêu cầu hỗ trợ (gồm hỏng, kiểm định...)
    }

    public enum Status {
        PENDING,     // Chờ xử lý (Service Staff thấy)
        IN_PROGRESS, // Đang xử lý (Đã gán cho Technical Staff)
        RESOLVED     // Đã giải quyết
    }
}
