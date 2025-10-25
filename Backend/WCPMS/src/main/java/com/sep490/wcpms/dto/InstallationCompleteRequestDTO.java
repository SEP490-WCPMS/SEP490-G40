package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InstallationCompleteRequestDTO {
    private String meterCode; // ID (VARCHAR) của đồng hồ (từ bảng water_meters)
    private BigDecimal initialReading; // Chỉ số ban đầu
    private String notes; // Ghi chú (nếu có)

    // --- THÊM TRƯỜNG NÀY ---
    private String installationImageBase64; // FE sẽ gửi chuỗi Base64
}