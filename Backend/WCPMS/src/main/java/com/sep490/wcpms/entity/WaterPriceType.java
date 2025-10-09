package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_price_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterPriceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String typeName;
    private String typeCode;
    private String description;

    @Enumerated(EnumType.STRING)
    private Status status = Status.active;

    private LocalDateTime createdAt;

    public enum Status {
        active, inactive
    }
}
