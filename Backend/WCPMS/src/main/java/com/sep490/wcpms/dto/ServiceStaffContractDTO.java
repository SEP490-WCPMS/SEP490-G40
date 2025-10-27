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
    private String notes;

    private Integer customerId;
    private String customerCode;
    private String customerName;

    private Integer serviceStaffId;
    private String serviceStaffName;

    private Integer technicalStaffId;
    private String technicalStaffName;

    private LocalDate surveyDate;
    private String technicalDesign;

    private String priceTypeName;
}
