package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MeterReplacementRequestDTO {
    private String oldMeterCode; // Mã đồng hồ CŨ
    private BigDecimal oldMeterFinalReading; // Chỉ số CUỐI của đồng hồ CŨ
    private String newMeterCode; // Mã đồng hồ MỚI
    private BigDecimal newMeterInitialReading; // Chỉ số ĐẦU của đồng hồ MỚI
    private String installationImageBase64; // Ảnh chụp đồng hồ MỚI
    private String replacementReason; // "BROKEN" hoặc "CALIBRATION"
    private BigDecimal calibrationCost; // Chi phí (nếu là CALIBRATION)
    private String notes; // Ghi chú chung
}
