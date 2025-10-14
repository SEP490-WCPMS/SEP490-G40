package com.sep490.wcpms.dto;

import com.sep490.wcpms.util.Constant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDTO {
    private Integer id;
    private String contractNumber;
    private Integer customerId;
    private LocalDate applicationDate;
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;
    private LocalDate installationDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal contractValue;
    private Constant.PaymentMethod paymentMethod;
    private Constant.ContractStatus contractStatus;
    private Integer serviceStaffId;
    private Integer technicalStaffId;
    private String notes;
}