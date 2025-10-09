package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meter_installations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeterInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne
    @JoinColumn(name = "meter_id")
    private WaterMeter meter;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private LocalDate installationDate;

    @ManyToOne
    @JoinColumn(name = "installation_staff_id")
    private Account installationStaff;

    private BigDecimal initialReading;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
