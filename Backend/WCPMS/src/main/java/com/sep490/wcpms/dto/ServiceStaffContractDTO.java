package com.sep490.wcpms.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ServiceStaffContractDTO {
    private Integer id;
    private String contractNumber;
    private String contractStatus;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal estimatedCost;
    private BigDecimal contractValue;
    private String paymentMethod; // Thêm: Phương thức thanh toán (CASH/BANK_TRANSFER/INSTALLMENT)
    private String notes;

    private Integer customerId;
    private String customerCode;
    private String customerName;

    // --- THÊM MỚI ---
    private String contactPhone; // SĐT liên hệ (quan trọng cho Guest)
    private String address;      // Địa chỉ lắp đặt
    private boolean guest;     // Cờ đánh dấu là Guest

    private Integer serviceStaffId;
    private String serviceStaffName;

    private Integer technicalStaffId;
    private String technicalStaffName;

    private LocalDate surveyDate;
    private String technicalDesign;

    private String priceTypeName;

    // Thêm: Ảnh chụp đồng hồ sau lắp đặt (base64) lấy từ bảng meter_installations
    private String installationImageBase64;

    // Provide explicit aliases to be safe for any old calls to setIsGuest()/getIsGuest()
    public boolean getIsGuest() {
        return this.guest;
    }

    public void setIsGuest(boolean isGuest) {
        this.guest = isGuest;
    }
}
