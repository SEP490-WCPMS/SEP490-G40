package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_usage_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractUsageDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_usage_details_contracts"))
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "price_type_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_usage_details_price_types"))
    private WaterPriceType priceType;

    @Column(name = "usage_percentage", precision = 5, scale = 2)
    private BigDecimal usagePercentage = BigDecimal.valueOf(100.00);

    @Column(name = "estimated_monthly_consumption", precision = 10, scale = 2)
    private BigDecimal estimatedMonthlyConsumption;

    @Column(name = "occupants")
    private Integer occupants;

    @Column(name = "basic_norm", precision = 10, scale = 2)
    private BigDecimal basicNorm;

    @Column(name = "norm_calculation_method", length = 50)
    private String normCalculationMethod;

    @Column(name = "drainage_fee_calculation")
    private Boolean drainageFeeCalculation = false;

    @Column(name = "cumulative_calculation")
    private Boolean cumulativeCalculation = false;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
