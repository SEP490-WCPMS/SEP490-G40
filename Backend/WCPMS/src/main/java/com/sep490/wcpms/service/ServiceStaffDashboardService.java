package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.dashboard.ChartDataDTO;
import com.sep490.wcpms.dto.dashboard.ServiceStaffStatsDTO;
import java.time.LocalDate;
import java.util.List;

public interface ServiceStaffDashboardService {
    ServiceStaffStatsDTO getServiceStaffStats(Integer staffId);
    ChartDataDTO getServiceStaffChartData(Integer staffId, LocalDate startDate, LocalDate endDate);
    List<ContractDetailsDTO> getRecentServiceStaffTasks(Integer staffId, String status, int limit);
}

