package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "water_meters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterMeter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "meter_code", length = 50, nullable = false, unique = true)
    private String meterCode;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "meter_type", length = 50)
    private String meterType;

    @Column(name = "meter_name", length = 100)
    private String meterName;

    @Column(length = 100)
    private String supplier;

    @Column(length = 20)
    private String size;

    @Column(precision = 10, scale = 2)
    private BigDecimal multiplier;

    @Column(name = "purchase_price", precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "max_reading", precision = 15, scale = 2)
    private BigDecimal maxReading;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meter_status", length = 20)
    private MeterStatus meterStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "waterMeter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeterInstallation> installations;

    public enum MeterStatus {
        IN_STOCK, INSTALLED, BROKEN, UNDER_MAINTENANCE, RETIRED
    }
}
