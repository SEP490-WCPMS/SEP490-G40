package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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
        name = "water_service_contracts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_water_service_contracts_number", columnNames = "contract_number")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterServiceContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "contract_number", length = 50, nullable = false, unique = true)
    private String contractNumber;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_water_service_contracts_customers"))
    private Customer customer;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "price_type_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_water_service_contracts_price_types"))
    private WaterPriceType priceType;

    @NotNull
    @Column(name = "service_start_date", nullable = false)
    private LocalDate serviceStartDate;

    @Column(name = "service_end_date")
    private LocalDate serviceEndDate;

    @Column(name = "contract_signed_date")
    private LocalDate contractSignedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_status", length = 30)
    private WaterServiceContractStatus contractStatus = WaterServiceContractStatus.ACTIVE;

    // --- THÊM TRƯỜNG BỊ THIẾU VÀO ĐÂY ---
    /**
     * Liên kết Hợp đồng Dịch vụ này với Hợp đồng Lắp đặt (Bảng 8)
     * đã tạo ra nó.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_contract_id", // Tên cột trong Bảng 9
            foreignKey = @ForeignKey(name = "fk_water_service_contracts_contracts")) // Tên khóa ngoại
    private Contract sourceContract;
    // --- HẾT PHẦN THÊM ---

    // ... (các trường payment_deadline, fees, termination...)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Account createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Account approvedBy;

    // ... (createdAt, updatedAt) ...

    // --- Mối quan hệ ngược (Tùy chọn nhưng nên có) ---
    // (Bạn cần thêm các import cho List, MeterInstallation)

    // 1 HĐ Dịch vụ liên kết với 1 HĐ Lắp đặt
    @OneToOne(mappedBy = "primaryWaterContract")
    private Contract installationContract;

    // 1 HĐ Dịch vụ liên kết với nhiều (hoặc 1) bản ghi Lắp đặt
    @OneToMany(mappedBy = "waterServiceContract")
    private List<MeterInstallation> meterInstallations;

    // ...existing code...

    public enum WaterServiceContractStatus {
        ACTIVE,         // Đang hoạt động
        SUSPENDED,      // Tạm ngưng
        TERMINATED,     // Chấm dứt
        EXPIRED         // Hết hạn
    }
}

