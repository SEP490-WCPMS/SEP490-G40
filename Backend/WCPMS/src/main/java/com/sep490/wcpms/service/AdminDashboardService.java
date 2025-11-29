package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.dashboard.AdminChartDataDTO;
import com.sep490.wcpms.dto.dashboard.AdminDashboardDTO;
import com.sep490.wcpms.dto.dashboard.NameValueDTO;
import java.time.LocalDate;
import java.util.List;

public interface AdminDashboardService {
    AdminDashboardDTO getOverview(LocalDate from, LocalDate to);
    AdminChartDataDTO getRevenueChart(LocalDate from, LocalDate to, String groupBy);
    List<NameValueDTO> getContractsByStatus(LocalDate from, LocalDate to);
}

