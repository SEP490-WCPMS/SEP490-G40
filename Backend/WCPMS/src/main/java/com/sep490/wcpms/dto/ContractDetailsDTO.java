// src/main/java/com/sep490/wcpms/dto/ContractDetailsDTO.java
package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Contract;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ContractDetailsDTO {
    private Integer id;
    private String contractNumber;
    private Contract.ContractStatus contractStatus;
    private LocalDate applicationDate;

    // Thông tin khách hàng
    private Integer customerId;
    private String customerName; // Giả định Customer có field `fullName` hoặc `name`
    private String customerAddress; // Giả định Customer có field `address`

    // Thông tin kỹ thuật (từ Survey Form)
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;

    // Thông tin kỹ thuật viên
    private Integer technicalStaffId;
    private String technicalStaffName; // Giả định Account có field `fullName` hoặc `name`

    // ... (Thêm các trường khác nếu Front-end cần)
}