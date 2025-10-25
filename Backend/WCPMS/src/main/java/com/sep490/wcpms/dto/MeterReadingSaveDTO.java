package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MeterReadingSaveDTO {
    // --- Dữ liệu cho Bảng 12 (MeterReading) ---
    private Integer meterInstallationId;
    private BigDecimal previousReading;
    private BigDecimal currentReading; // Số mới từ AI/thủ công
    private String notes;

    // --- Dữ liệu cho Bảng Log Mới ---
    private String aiDetectedReading;
    private String aiDetectedMeterId;
    private String userCorrectedMeterIdText; // Đây là contractId (dạng text) mà user nhập
    private String scanImageBase64; // Ảnh chụp
}