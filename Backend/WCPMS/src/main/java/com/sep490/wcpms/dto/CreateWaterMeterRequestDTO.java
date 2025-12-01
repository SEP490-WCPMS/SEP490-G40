package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateWaterMeterRequestDTO {
    @NotBlank
    private String meterCode;
    @NotBlank
    private String serialNumber;
    private String meterType;
    private String meterName;
    private String supplier;
    private String size;
    private BigDecimal multiplier;
    private BigDecimal purchasePrice;
    private BigDecimal maxReading;
    private LocalDate installationDate;
    private LocalDate nextMaintenanceDate;
    // optional initial status (IN_STOCK, INSTALLED, BROKEN, UNDER_MAINTENANCE, RETIRED)
    private String meterStatus;
}

