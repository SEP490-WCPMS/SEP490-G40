package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Contract;
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
    private Integer customerId; // Có thể null cho guest
    private String contactPhone; // Quan trọng cho guest (khi customerId = null)
    private LocalDate applicationDate;
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;
    private LocalDate installationDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal contractValue;
    private Contract.PaymentMethod paymentMethod;
    private Contract.ContractStatus contractStatus;
    private Integer serviceStaffId;
    private Integer technicalStaffId;
    private String notes;
}