package com.sep490.wcpms.dto.contract;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data // Lombok tự tạo getter, setter, constructor...
public class ContractDTO {

    private Long id;
    private String contractNumber;
    private String contractStatus; // Chuyển từ enum sang String để dễ dùng ở frontend
    private LocalDate applicationDate;
    private LocalDate surveyDate;
    private LocalDate installationDate;
    private LocalDate startDate;
    private String notes;

    // Các thông tin phẳng hóa từ Customer Entity
    private String customerCode;
    private String customerName;
    private String address;

    // Các thông tin phẳng hóa từ Account Entity (Nhân viên)
    private String serviceStaffName;
    private String technicalStaffName;
}