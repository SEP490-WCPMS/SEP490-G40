package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateWaterPriceRequestDTO {
    @NotNull
    private Integer priceTypeId;

    private String typeName;
    @NotNull
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;
    @NotNull
    private LocalDate effectiveDate;
    private String approvedBy;
}

