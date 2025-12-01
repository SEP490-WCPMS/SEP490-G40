package com.sep490.wcpms.dto.dashboard;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class AdminChartDataDTO {
    private List<String> labels; // e.g., dates as YYYY-MM-DD
    private List<BigDecimal> revenueValues; // revenue per label
    private List<Long> contractsCreated; // contract counts per label
}

