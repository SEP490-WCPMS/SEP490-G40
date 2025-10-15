package com.sep490.wcpms.entity;

import com.sep490.wcpms.util.Constant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "contracts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_contracts_contract_number", columnNames = "contract_number")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 50)
    @Column(name = "contract_number", length = 50, nullable = false, unique = true)
    private String contractNumber;

    @NotNull
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @JoinColumn(name = "customer_id", nullable = false,
//            foreignKey = @ForeignKey(name = "fk_contracts_customers"))
    @Column(name = "customer_id", length = 20, nullable = false)
    private Integer customerId;

    @Column(name = "application_date")
    private LocalDate applicationDate;

    @Column(name = "survey_date")
    private LocalDate surveyDate;

    @Lob
    @Column(name = "technical_design", columnDefinition = "TEXT")
    private String technicalDesign;

    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "contract_value", precision = 15, scale = 2)
    private BigDecimal contractValue;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    @Column(name = "contract_status", length = 20, nullable = false)
    private String contractStatus = Constant.ContractStatus.DRAFT;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "service_staff_id",
//            foreignKey = @ForeignKey(name = "fk_contracts_accounts_service"))
    @Column(name = "service_staff_id", length = 20, nullable = false)
    private Integer serviceStaffId;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "technical_staff_id",
//            foreignKey = @ForeignKey(name = "fk_contracts_accounts_technical"))
    @Column(name = "technical_staff_id", length = 20, nullable = false)
    private Integer technicalStaffId;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
