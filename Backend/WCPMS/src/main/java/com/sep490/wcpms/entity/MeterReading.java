package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

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

    // ========== AUTO-ASSIGN ACCOUNTING STAFF ==========
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "accounting_staff_id",
        foreignKey = @ForeignKey(name = "fk_meter_readings_accounts_accounting_assigned")
    )
    private Account accountingStaff; // Accounting Staff được assign tự động để lập HĐ tiền nước
    // ===================================================

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ReadingStatus {
        PENDING, COMPLETED, VERIFIED, DISPUTED
    }
}
