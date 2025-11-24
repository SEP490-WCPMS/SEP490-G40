package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WaterPriceTypeAdminResponseDTO {
    private Integer id;
    private String typeName;
    private String typeCode;
    private String description;
    private String usagePurpose;
    private BigDecimal percentageRate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

