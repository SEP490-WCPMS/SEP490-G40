package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@Builder
public class WaterMeterAdminResponseDTO {
    private Integer id;
    private String meterCode;
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
    private String meterStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

