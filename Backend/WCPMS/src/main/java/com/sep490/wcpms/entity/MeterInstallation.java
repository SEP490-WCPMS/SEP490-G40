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
@Table(name = "meter_installations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeterInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", foreignKey = @ForeignKey(name = "fk_meter_installations_contracts"))
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", foreignKey = @ForeignKey(name = "fk_meter_installations_water_meters"))
    private WaterMeter waterMeter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(name = "fk_meter_installations_customers"))
    private Customer customer;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    // --- SỬA LẠI CHỖ NÀY ---
    @ManyToOne(fetch = FetchType.LAZY)
    // Đổi @JoinColumn "name" cho khớp với tên cột mới
    @JoinColumn(name = "technical_staff_id", foreignKey = @ForeignKey(name = "fk_meter_installations_accounts"))
    private Account technicalStaff; // Đổi tên biến cho nhất quán

    @Column(name = "initial_reading", precision = 15, scale = 2)
    private BigDecimal initialReading;

    @Lob
    private String notes;

    // --- THÊM TRƯỜNG NÀY ---
    @Lob // Dùng @Lob để map với kiểu LONGTEXT
    @Column(name = "installation_image_base64")
    private String installationImageBase64;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "meterInstallation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeterReading> meterReadings;
}
