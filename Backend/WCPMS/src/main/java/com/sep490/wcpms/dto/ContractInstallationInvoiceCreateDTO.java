package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ContractInstallationInvoiceCreateDTO {
    @NotNull
    private Integer contractId;     // Hợp đồng lắp đặt

    @NotNull
    private String invoiceNumber;   // Số HĐ (có thể để FE sinh kiểu CN-xxxxx)

    @NotNull
    private LocalDate invoiceDate;  // Ngày lập HĐ

    @NotNull
    private LocalDate dueDate;      // Hạn thanh toán

    @NotNull
    @Positive(message = "Tiền lắp đặt (chưa VAT) phải lớn hơn 0")
    private BigDecimal subtotalAmount;

    @NotNull
    @PositiveOrZero(message = "Tiền VAT không được âm")
    private BigDecimal vatAmount;

    @NotNull
    @Positive(message = "Tổng tiền hóa đơn phải lớn hơn 0")
    private BigDecimal totalAmount;
}
