package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.WaterPrice;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class WaterPriceDetailDTO {
    private String typeName;
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;
    private LocalDate effectiveDate;
    private String approvedBy;

    // Constructor để chuyển đổi từ Entity
    public WaterPriceDetailDTO(WaterPrice wp) {
        this.typeName = wp.getTypeName();
        this.unitPrice = wp.getUnitPrice();
        this.environmentFee = wp.getEnvironmentFee();
        this.vatRate = wp.getVatRate();
        this.effectiveDate = wp.getEffectiveDate();
        this.approvedBy = wp.getApprovedBy();
    }
}