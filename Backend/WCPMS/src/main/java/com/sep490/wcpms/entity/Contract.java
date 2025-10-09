package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String contractNumber;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private LocalDate applicationDate;
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;
    private LocalDate installationDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal contractValue;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private ContractStatus contractStatus = ContractStatus.draft;

    @ManyToOne
    @JoinColumn(name = "service_staff_id")
    private Account serviceStaff;

    @ManyToOne
    @JoinColumn(name = "technical_staff_id")
    private Account technicalStaff;

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum PaymentMethod {
        cash, bank_transfer, installment
    }

    public enum ContractStatus {
        draft, pending, approved, active, expired, terminated, suspended
    }
}
