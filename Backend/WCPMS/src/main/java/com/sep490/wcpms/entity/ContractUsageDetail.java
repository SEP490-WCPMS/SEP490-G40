package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
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
    private Long id;

    @ManyToOne
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne
    @JoinColumn(name = "price_type_id")
    private WaterPriceType priceType;

    private BigDecimal usagePercentage;
    private BigDecimal estimatedMonthlyConsumption;
    private Integer occupants;
    private BigDecimal basicNorm;
    private String normCalculationMethod;
    private Boolean drainageFeeCalculation;
    private Boolean cumulativeCalculation;
    private String notes;
    private LocalDateTime createdAt;
}
