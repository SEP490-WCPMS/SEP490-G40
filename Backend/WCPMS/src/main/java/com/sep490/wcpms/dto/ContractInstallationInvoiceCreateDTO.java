package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotNull;
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
    private BigDecimal subtotalAmount; // = contract_value

    @NotNull
    private BigDecimal vatAmount;      // FE tính sẵn

    @NotNull
    private BigDecimal totalAmount;    // FE tính sẵn (subtotal + VAT)
}
