package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ReadingConfirmationDTO {
    private String contractNumber;
    private String customerName;
    private String customerAddress;
    // --- BỔ SUNG THÊM CÁC TRƯỜNG NÀY ---
    private String customerCode;    // Mã KH
    private String customerPhone;   // SĐT
    private String priceType;       // Loại giá (Sinh hoạt/KD)
    private String meterSerial;     // Số seri đồng hồ
    private String routeName;       // Tên tuyến

    // ID của bản ghi lắp đặt, dùng để lưu
    private Integer meterInstallationId;

    // Chỉ số của lần đọc TRƯỚC
    private BigDecimal previousReading;
}