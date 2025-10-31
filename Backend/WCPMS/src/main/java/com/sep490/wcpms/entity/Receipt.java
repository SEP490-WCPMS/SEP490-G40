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
@Table(name = "receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "receipt_number", length = 50, nullable = false, unique = true)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_receipts_invoices"))
    private Invoice invoice;

    @Column(name = "payment_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal paymentAmount;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20, nullable = false)
    private PaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cashier_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_receipts_accounts"))
    private Account cashier;

    @Lob
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum PaymentMethod {
        CASH, BANK_TRANSFER, BANK_APP
    }
}
