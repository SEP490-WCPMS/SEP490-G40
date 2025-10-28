package com.sep490.wcpms.entity;

//import com.sep490.wcpms.util.Constant;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "annul_transfer_contract_requests",
        uniqueConstraints = @UniqueConstraint(name = "uk_annul_request_number", columnNames = "request_number"))
public class ContractAnnulTransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // FK: contracts.id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_annul_contract"))
    private Contract contract;

    @Column(name = "request_type", nullable = false, length = 20)
    private String requestType;

    @Column(name = "request_number", length = 50, nullable = false)
    private String requestNumber;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Lob
    @Column(name = "reason", nullable = false)
    private String reason;

    @Lob
    @Column(name = "attached_evidence")
    private String attachedEvidence; // JSON list/URLs/paths tùy bạn quy ước

    // FK: accounts.id (người tạo yêu cầu)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_annul_requested_by"))
    private Account requestedBy;

    // FK: accounts.id (người duyệt)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by",
            foreignKey = @ForeignKey(name = "fk_annul_approved_by"))
    private Account approvedBy;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    // transfer only
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_customer_id")
    private Customer fromCustomer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_customer_id")
    private Customer toCustomer;

    @Column(name = "notes")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDate updatedAt;

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}

