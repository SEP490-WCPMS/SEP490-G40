package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
// DTO này trả về thông tin HĐ và chỉ số cũ khi NV Kỹ thuật tìm mã đồng hồ
public class MeterInfoDTO {
    private String customerName;
    private String customerAddress;
    private String contractNumber; // Số HĐ Dịch vụ (Bảng 9)
    private Integer meterInstallationId; // ID bản ghi Lắp đặt CŨ (Bảng 11)
    private BigDecimal lastReading; // Chỉ số cũ (lần đọc trước hoặc chỉ số gốc)
}
