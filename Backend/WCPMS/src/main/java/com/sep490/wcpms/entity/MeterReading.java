package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meter_readings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_installation_id", foreignKey = @ForeignKey(name = "fk_meter_readings_installations"))
    private MeterInstallation meterInstallation;

    @Column(name = "reading_date")
    private LocalDate readingDate;

    @Column(name = "previous_reading", precision = 15, scale = 2)
    private BigDecimal previousReading;

    @Column(name = "current_reading", precision = 15, scale = 2)
    private BigDecimal currentReading;

    @Column(precision = 15, scale = 2)
    private BigDecimal consumption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reader_id", foreignKey = @ForeignKey(name = "fk_meter_readings_accounts"))
    private Account reader;

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_status", length = 20)
    private ReadingStatus readingStatus;

    @Lob
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum ReadingStatus {
        PENDING, COMPLETED, VERIFIED, DISPUTED
    }
}
