package com.sep490.wcpms.entity;

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
import java.util.List;

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
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_contracts_customers"))
    private Customer customer;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_status", length = 30, nullable = false)
    private ContractStatus contractStatus = ContractStatus.DRAFT;

    // Liên kết đến service staff
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_staff_id",
            foreignKey = @ForeignKey(name = "fk_contracts_accounts_service"))
    private Account serviceStaff;

    // Liên kết đến technical staff
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technical_staff_id",
            foreignKey = @ForeignKey(name = "fk_contracts_accounts_technical"))
    private Account technicalStaff;

    // Hợp đồng cấp nước chính hiện tại
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_water_contract_id",
            foreignKey = @ForeignKey(name = "fk_contracts_water_service_contracts"))
    private WaterServiceContract primaryWaterContract;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Một hợp đồng có thể có nhiều invoice
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Invoice> invoices;

    // Một hợp đồng có thể gắn với nhiều lần lắp đặt đồng hồ
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeterInstallation> meterInstallations;

    // Một hợp đồng có thể có nhiều chi tiết sử dụng nước
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContractUsageDetail> contractUsageDetails;

    // Enum cho payment_method
    public enum PaymentMethod {
        CASH, BANK_TRANSFER, INSTALLMENT
    }

    // Enum cho contract_status
    public enum ContractStatus {
        DRAFT,                  // Nháp (Service Staff tạo)
        PENDING,                // Chờ khảo sát (Đã gửi cho Technical)
        PENDING_SURVEY_REVIEW,  // Chờ duyệt báo cáo (Technical đã gửi báo cáo)
        APPROVED,               // Đã duyệt báo cáo (Service Staff đã duyệt)
        PENDING_CUSTOMER_SIGN,  // Chờ ký (Đã gửi cho khách)
        PENDING_SIGN,           // Chờ ký (Khách đã ký)
        SIGNED,                 // Đã ký (Khách và dịch vụ đã ký)
        ACTIVE,                 // Đang hoạt động (Đã lắp đặt xong)
        EXPIRED,               // Hết hạn
        SUSPENDED,             // Tạm ngưng
        TERMINATED             // Chấm dứt
    }
}
