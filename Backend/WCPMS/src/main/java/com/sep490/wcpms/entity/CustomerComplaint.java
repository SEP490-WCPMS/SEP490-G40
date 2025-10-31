package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerComplaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "complaint_number", length = 50, unique = true, nullable = false)
    private String complaintNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_customer_complaints_customers"))
    private Customer customer;

    @Column(name = "complaint_type", length = 50)
    private String complaintType;  // QUALITY, SERVICE, BILLING, METER, PRESSURE

    @Lob
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "complaint_date")
    private LocalDateTime complaintDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ComplaintStatus status = ComplaintStatus.PENDING;

    @Lob
    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to",
            foreignKey = @ForeignKey(name = "fk_customer_complaints_assigned_to"))
    private Account assignedTo;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ComplaintStatus {
        PENDING, IN_PROGRESS, RESOLVED, REJECTED
    }
}

