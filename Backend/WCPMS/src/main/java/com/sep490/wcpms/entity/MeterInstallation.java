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
import com.sep490.wcpms.entity.Customer;
import jakarta.persistence.ManyToOne;

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
    @JoinColumn(name = "water_service_contract_id",
            foreignKey = @ForeignKey(name = "fk_meter_installations_water_service_contracts"))
    private WaterServiceContract waterServiceContract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", foreignKey = @ForeignKey(name = "fk_meter_installations_water_meters"))
    private WaterMeter waterMeter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(name = "fk_meter_installations_customers"))
    private Customer customer;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technical_staff_id", foreignKey = @ForeignKey(name = "fk_meter_installations_accounts"))
    private Account technicalStaff;

    @Column(name = "initial_reading", precision = 15, scale = 2)
    private BigDecimal initialReading = BigDecimal.ZERO;

    @Lob
    @Column(name = "installation_image_base64", columnDefinition = "LONGTEXT")
    private String installationImageBase64;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "meterInstallation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeterReading> meterReadings;
}
