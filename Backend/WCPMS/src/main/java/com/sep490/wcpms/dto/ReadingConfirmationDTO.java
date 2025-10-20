package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ReadingConfirmationDTO {
    private String contractNumber;
    private String customerName;
    private String customerAddress;

    // ID của bản ghi lắp đặt, dùng để lưu
    private Integer meterInstallationId;

    // Chỉ số của lần đọc TRƯỚC
    private BigDecimal previousReading;
}