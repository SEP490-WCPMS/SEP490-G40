package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "water_price_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterPriceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "type_name", length = 100, nullable = false)
    private String typeName;

    @Column(name = "type_code", length = 50, nullable = false, unique = true)
    private String typeCode;

    @Lob
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "usage_purpose", length = 255)
    private String usagePurpose;

    @Column(name = "percentage_rate", precision = 5, scale = 2)
    private BigDecimal percentageRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "priceType", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WaterPrice> waterPrices;

    public enum Status {
        ACTIVE, INACTIVE
    }
}
