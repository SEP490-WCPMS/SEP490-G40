package com.sep490.wcpms.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ServiceStaffUpdateContractRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
    private BigDecimal estimatedCost;
    private BigDecimal contractValue;
    private String paymentMethod; // e.g. "CASH" or "BANK_TRANSFER", will map to enum
    private Integer serviceStaffId; // optional - to assign service staff
}
