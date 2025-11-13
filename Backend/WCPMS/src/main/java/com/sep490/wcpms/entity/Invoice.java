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

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "invoice_number", length = 50, nullable = false, unique = true)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false)
    private InvoiceType invoiceType = InvoiceType.WATER_SERVICE; // default

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_invoices_customers"))
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_invoices_contracts"))
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meter_reading_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_invoices_meter_readings"))
    private MeterReading meterReading;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(name = "total_consumption", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalConsumption;

    @Column(name = "subtotal_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal subtotalAmount;

    @Column(name = "vat_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "environment_fee_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal environmentFeeAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "late_payment_fee", precision = 15, scale = 2)
    private BigDecimal latePaymentFee = BigDecimal.ZERO;

    @Column(name = "is_minimum_usage_fee")
    private Integer isMinimumUsageFee = 0;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20, nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accounting_staff_id",
            foreignKey = @ForeignKey(name = "fk_invoices_accounts"))
    private Account accountingStaff;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceDetail> invoiceDetails;

    public enum PaymentStatus {
        PENDING, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID
    }

    public enum InvoiceType {
        CONTRACT, WATER_SERVICE
    }
}
