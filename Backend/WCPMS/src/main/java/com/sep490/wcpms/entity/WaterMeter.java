package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_meters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterMeter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String meterCode;
    private String serialNumber;
    private String meterType;
    private String meterName;
    private String supplier;
    private String size;
    private BigDecimal multiplier;
    private BigDecimal purchasePrice;
    private BigDecimal maxReading;
    private LocalDate installationDate;
    private LocalDate nextMaintenanceDate;

    @Enumerated(EnumType.STRING)
    private MeterStatus meterStatus = MeterStatus.in_stock;

    private LocalDateTime createdAt;

    public enum MeterStatus {
        in_stock, installed, broken, under_maintenance, retired
    }
}
