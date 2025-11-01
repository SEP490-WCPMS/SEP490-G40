package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.sep490.wcpms.entity.MeterCalibration.CalibrationStatus;

@Data
public class OnSiteCalibrationDTO {
    private String meterCode; // Mã đồng hồ vừa kiểm định
    private LocalDate calibrationDate; // Ngày kiểm định
    private CalibrationStatus calibrationStatus; // Trạng thái: PASSED, FAILED
    private LocalDate nextCalibrationDate; // Ngày kiểm định tiếp theo
    private String calibrationCertificateNumber; // Số chứng chỉ
    private BigDecimal calibrationCost; // Chi phí kiểm định
    private String notes; // Ghi chú
}