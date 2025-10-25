package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", foreignKey = @ForeignKey(name = "fk_customers_accounts"))
    private Account account;

    @Column(name = "customer_code", length = 50, nullable = false, unique = true)
    private String customerCode;

    @Column(name = "customer_name", length = 100, nullable = false)
    private String customerName;

    @Column(name = "identity_number", length = 20)
    private String identityNumber;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "street", length = 100)
    private String street;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", foreignKey = @ForeignKey(name = "fk_customers_wards"))
    private Ward ward;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "route_id")
    private Integer routeId;

    @Column(name = "route_order")
    private Integer routeOrder;

    @Column(name = "block_meter_id")
    private Integer blockMeterId;

    @Column(name = "policy_id")
    private Integer policyId;

    @Column(name = "payment_limit", precision = 15, scale = 2)
    private BigDecimal paymentLimit;

    @Column(name = "maintenance_fee_plan", precision = 15, scale = 2)
    private BigDecimal maintenanceFeePlan;

    @Column(name = "meter_rental_total", precision = 15, scale = 2)
    private BigDecimal meterRentalTotal;

    @Column(name = "meter_rental_paid", precision = 15, scale = 2)
    private BigDecimal meterRentalPaid;

    @Column(name = "monthly_meter_rental", precision = 15, scale = 2)
    private BigDecimal monthlyMeterRental;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_type", length = 20)
    private ConnectionType connectionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", length = 20)
    private ConnectionStatus connectionStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "meter_status", length = 20)
    private MeterStatus meterStatus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Một customer có nhiều hợp đồng
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Contract> contracts;

    public enum ConnectionType { RESIDENTIAL, COMMERCIAL, ADMINISTRATIVE }
    public enum ConnectionStatus { ACTIVE, INACTIVE, SUSPENDED, TERMINATED }
    public enum MeterStatus { WORKING, BROKEN, STOLEN, UNDER_MAINTENANCE }
}
