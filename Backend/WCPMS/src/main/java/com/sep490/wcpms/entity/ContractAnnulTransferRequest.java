package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "annul_transfer_contract_requests",
        uniqueConstraints = @UniqueConstraint(name = "uk_annul_request_number", columnNames = "request_number"))
public class ContractAnnulTransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_annul_contract"))
    private Contract contract;

    // MỚI: Địa chỉ (quan trọng khi chuyển nhượng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id",
            foreignKey = @ForeignKey(name = "fk_transfer_address"))
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private RequestType requestType;

    @Column(name = "request_number", length = 50, nullable = false, unique = true)
    private String requestNumber;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Lob
    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Lob
    @Column(name = "attached_evidence", columnDefinition = "LONGTEXT")
    private String attachedEvidence;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_annul_requested_by"))
    private Account requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by",
            foreignKey = @ForeignKey(name = "fk_annul_approved_by"))
    private Account approvedBy;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_staff_id", foreignKey = @ForeignKey(name = "fk_annul_transfer_service_staff"))
    private Account serviceStaff;

    // Transfer-only fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_customer_id",
            foreignKey = @ForeignKey(name = "fk_annul_from_customer"))
    private Customer fromCustomer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_customer_id",
            foreignKey = @ForeignKey(name = "fk_annul_to_customer"))
    private Customer toCustomer;

    @Column(name = "settlement_amount", precision = 15, scale = 2)
    private BigDecimal settlementAmount;

    // Thời hạn theo hợp đồng
    @Column(name = "deadline_days")
    private Integer deadlineDays = 15;

    @Column(name = "expected_completion_date")
    private LocalDate expectedCompletionDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Lob
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RequestType {
        ANNUL,      // Hủy
        TRANSFER    // Chuyển nhượng
    }

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
