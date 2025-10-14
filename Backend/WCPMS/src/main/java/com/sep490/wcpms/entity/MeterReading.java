package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "meter_readings")
@Data
public class MeterReading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meter_installation_id", nullable = false)
    private Long meterInstallationId;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate = LocalDate.now();

    @Column(name = "previous_reading", nullable = false)
    private Double previousReading;

    @Column(name = "current_reading", nullable = false)
    private Double currentReading;

    @Column(name = "consumption", nullable = false)
    private Double consumption;

    @Column(name = "reader_id", nullable = false)
    private Long readerId;

    @Column(name = "reading_status")
    @Enumerated(EnumType.STRING)
    private ReadingStatus readingStatus = ReadingStatus.COMPLETED;

    @Column(name = "notes")
    private String notes;

    public enum ReadingStatus {
        PENDING, COMPLETED, VERIFIED, DISPUTED
    }
}
