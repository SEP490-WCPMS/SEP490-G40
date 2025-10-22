package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_scan_logs")
@Data
public class AiScanLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reader_id")
    private Account reader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_installation_id")
    private MeterInstallation meterInstallation;

    @Column(name = "ai_detected_reading", length = 50)
    private String aiDetectedReading;

    @Column(name = "ai_detected_meter_id", length = 50)
    private String aiDetectedMeterId;

    @Column(name = "user_corrected_reading", nullable = false, precision = 15, scale = 2)
    private BigDecimal userCorrectedReading;

    @Column(name = "user_corrected_meter_id_text", length = 50)
    private String userCorrectedMeterIdText;

    @Lob
    @Column(name = "scan_image_base64", nullable = false, columnDefinition = "LONGTEXT")
    private String scanImageBase64;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}