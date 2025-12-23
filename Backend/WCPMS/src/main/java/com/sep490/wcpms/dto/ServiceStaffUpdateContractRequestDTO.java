package com.sep490.wcpms.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ServiceStaffUpdateContractRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate installationDate;
    private String notes;
    private BigDecimal estimatedCost;
    private BigDecimal contractValue;
    private String paymentMethod; // e.g. "CASH" or "BANK_TRANSFER", will map to enum
    private Integer serviceStaffId; // optional - to assign service staff
    private Integer technicalStaffId; // to assign technical staff for survey

    //Thêm 2 trường nãy để sửa khi khách từ chối
    private String contactPhone; // Sửa số điện thoại liên hệ
    private String address;      // Sửa địa chỉ lắp đặt
}
