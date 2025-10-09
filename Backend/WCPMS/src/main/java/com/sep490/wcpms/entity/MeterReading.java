package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
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
    private Long id;

    @ManyToOne
    @JoinColumn(name = "meter_installation_id")
    private MeterInstallation meterInstallation;

    private LocalDate readingDate;
    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal consumption;

    @ManyToOne
    @JoinColumn(name = "reader_id")
    private Account reader;

    @Enumerated(EnumType.STRING)
    private ReadingStatus readingStatus = ReadingStatus.completed;

    private String notes;
    private LocalDateTime createdAt;

    public enum ReadingStatus {
        pending, completed, verified, disputed
    }
}
