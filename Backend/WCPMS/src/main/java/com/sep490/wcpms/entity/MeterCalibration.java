package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.sep490.wcpms.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meter_calibrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeterCalibration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meter_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_meter_calibrations_water_meters"))
    private WaterMeter meter;

    @Column(name = "calibration_date", nullable = false)
    private LocalDate calibrationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "calibration_status", length = 20)
    private CalibrationStatus calibrationStatus = CalibrationStatus.PENDING;

    @Column(name = "next_calibration_date")
    private LocalDate nextCalibrationDate;

    @Column(name = "calibration_certificate_number", length = 50)
    private String calibrationCertificateNumber;

    @Column(name = "calibration_cost", precision = 15, scale = 2)
    private BigDecimal calibrationCost;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- THÊM TRƯỜNG MỚI (TỪ ALTER TABLE) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", // Tên cột trong Bảng 14
            foreignKey = @ForeignKey(name = "fk_cal_invoice_id"))
    private Invoice invoice; // Liên kết đến hóa đơn đã thanh toán
    // --- HẾT PHẦN THÊM ---

    public enum CalibrationStatus {
        PASSED, FAILED, PENDING
    }
}

