package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class WaterBillCalculationDTO {
    private Integer meterReadingId;
    private LocalDate readingDate;
    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal consumption;

    private String priceTypeName;
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;

    private BigDecimal subtotalAmount; // Tiền nước
    private BigDecimal environmentFeeAmount; // Tiền phí BVMT
    private BigDecimal vatAmount; // Tiền VAT
    private BigDecimal totalAmount; // Tổng cộng
}