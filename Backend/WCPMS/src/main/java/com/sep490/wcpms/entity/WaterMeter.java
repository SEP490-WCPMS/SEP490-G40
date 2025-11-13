package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.OneToMany;

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

    @Column(name = "serial_number", length = 100, nullable = false)
    private String serialNumber;

    @Column(name = "meter_type", length = 50)
    private String meterType;

    @Column(name = "meter_name", length = 100)
    private String meterName;

    @Column(name = "supplier", length = 100)
    private String supplier;

    @Column(name = "size", length = 20)
    private String size;

    @Column(name = "multiplier", precision = 10, scale = 2)
    private BigDecimal multiplier = BigDecimal.ONE;

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
    private MeterStatus meterStatus = MeterStatus.IN_STOCK;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "waterMeter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeterInstallation> installations;

    public enum MeterStatus {
        IN_STOCK, INSTALLED, BROKEN, UNDER_MAINTENANCE, RETIRED
    }
}
