package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateWaterPriceTypeRequestDTO {
    @NotBlank
    private String typeName;
    @NotBlank
    private String typeCode;
    private String description;
    private String usagePurpose;
    private BigDecimal percentageRate;
}

