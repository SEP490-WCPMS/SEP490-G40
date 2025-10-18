package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "priceType", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WaterPrice> waterPrices;

    public enum Status { ACTIVE, INACTIVE }
}
