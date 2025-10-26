// src/main/java/com/sep490/wcpms/service/TechnicalDashboardService.java
package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.dashboard.ChartDataDTO;
import com.sep490.wcpms.dto.dashboard.TechnicalStatsDTO;
import java.time.LocalDate;
import java.util.List;

public interface TechnicalDashboardService {
    TechnicalStatsDTO getTechnicalStats(Integer staffId);
    ChartDataDTO getTechnicalChartData(Integer staffId, LocalDate startDate, LocalDate endDate);
    List<ContractDetailsDTO> getRecentTechnicalTasks(Integer staffId, String status, int limit);
}