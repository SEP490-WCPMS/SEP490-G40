package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String invoiceNumber;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne
    @JoinColumn(name = "meter_reading_id")
    private MeterReading meterReading;

    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal totalConsumption;
    private BigDecimal subtotalAmount;
    private BigDecimal vatAmount;
    private BigDecimal environmentFeeAmount;
    private BigDecimal totalAmount;
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.pending;

    private LocalDate invoiceDate;

    @ManyToOne
    @JoinColumn(name = "accounting_staff_id")
    private Account accountingStaff;

    private LocalDateTime createdAt;

    public enum PaymentStatus {
        pending, paid, overdue, cancelled, partially_paid
    }
}
