package com.sep490.wcpms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SurveyReportRequestDTO {
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;
    private String notes;
}