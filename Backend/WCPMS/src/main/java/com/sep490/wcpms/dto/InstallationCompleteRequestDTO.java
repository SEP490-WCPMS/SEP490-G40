package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InstallationCompleteRequestDTO {
    private Integer meterId; // ID của đồng hồ được lắp
    private BigDecimal initialReading; // Chỉ số ban đầu
    private String notes; // Ghi chú (nếu có)
}