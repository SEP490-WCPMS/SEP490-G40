package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
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
    private Long id;

    @ManyToOne
    @JoinColumn(name = "price_type_id")
    private WaterPriceType priceType;

    private String typeName;
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;
    private LocalDate effectiveDate;
    private String approvedBy;

    @Enumerated(EnumType.STRING)
    private Status status = Status.active;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private Account createdBy;

    @ManyToOne
    @JoinColumn(name = "updated_by")
    private Account updatedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum Status {
        active, inactive, pending
    }
}
