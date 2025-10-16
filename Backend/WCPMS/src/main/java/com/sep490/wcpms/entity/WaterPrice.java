package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_prices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_type_id", foreignKey = @ForeignKey(name = "fk_water_prices_price_types"))
    private WaterPriceType priceType;

    @Column(name = "type_name", length = 100)
    private String typeName;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "environment_fee", precision = 15, scale = 2)
    private BigDecimal environmentFee;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status { ACTIVE, INACTIVE, PENDING }
}
