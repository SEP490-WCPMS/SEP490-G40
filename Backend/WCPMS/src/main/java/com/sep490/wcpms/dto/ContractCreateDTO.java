package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class ContractCreateDTO {
    @NotBlank(message = "Contract number is required")
    @Size(max = 50, message = "Contract number cannot exceed 50 characters")
    private String contractNumber;

    // customerId có thể null (cho guest), nhưng khi null thì PHẢI có contactPhone
    private Integer customerId;

    // Số điện thoại liên hệ - BẮT BUỘC khi customerId = null (guest)
    @Size(max = 20, message = "Contact phone cannot exceed 20 characters")
    private String contactPhone;

    private LocalDate applicationDate;
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;
    private LocalDate installationDate;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;
    private BigDecimal contractValue;
    private String paymentMethod;
    private String contractStatus;

    @NotNull(message = "Service staff ID is required")
    private Integer serviceStaffId;

    @NotNull(message = "Technical staff ID is required")
    private Integer technicalStaffId;

    private String notes;
}
