package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MeterReadingSaveDTO {
    private Integer meterInstallationId;
    private BigDecimal previousReading;
    private BigDecimal currentReading; // Số mới từ AI/thủ công
    private String notes;
}