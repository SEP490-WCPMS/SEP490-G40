package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    private String customerCode;
    private String customerName;
    private String identityNumber;
    private String address;
    private String street;

    @ManyToOne
    @JoinColumn(name = "ward_id")
    private Ward ward;

    private String district;
    private String province;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private ReadingRoute route;

    private Integer routeOrder;

    private Integer blockMeterId;
    private Integer policyId;

    private BigDecimal paymentLimit;
    private BigDecimal maintenanceFeePlan;
    private BigDecimal meterRentalTotal;
    private BigDecimal meterRentalPaid;
    private BigDecimal monthlyMeterRental;

    private Integer connectionTypeId;

    @Enumerated(EnumType.STRING)
    private ConnectionType connectionType;

    @Enumerated(EnumType.STRING)
    private ConnectionStatus connectionStatus = ConnectionStatus.active;

    @Enumerated(EnumType.STRING)
    private MeterStatus meterStatus = MeterStatus.working;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum ConnectionType {
        residential, commercial, administrative
    }

    public enum ConnectionStatus {
        active, inactive, suspended, terminated
    }

    public enum MeterStatus {
        working, broken, stolen, under_maintenance
    }
}
