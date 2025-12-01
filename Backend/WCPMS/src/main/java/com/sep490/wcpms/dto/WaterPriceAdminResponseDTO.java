package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class WaterPriceAdminResponseDTO {
    private Integer id;
    private Integer priceTypeId;
    private String priceTypeName;
    private String typeName;
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;
    private LocalDate effectiveDate;
    private String approvedBy;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

