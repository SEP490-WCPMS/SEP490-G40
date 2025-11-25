package com.sep490.wcpms.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateWaterPriceRequestDTO {
    private Integer priceTypeId;
    private String typeName;
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;
    private LocalDate effectiveDate;
    private String approvedBy;
    private String status; // ACTIVE, INACTIVE, PENDING
}

