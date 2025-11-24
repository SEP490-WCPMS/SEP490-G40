package com.sep490.wcpms.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateWaterPriceTypeRequestDTO {
    private String typeName;
    private String typeCode;
    private String description;
    private String usagePurpose;
    private BigDecimal percentageRate;
    private String status; // ACTIVE or INACTIVE
}

