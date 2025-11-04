package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.dashboard.ChartDataDTO;
import com.sep490.wcpms.dto.dashboard.ServiceStaffStatsDTO;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import com.sep490.wcpms.service.ServiceStaffDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/service/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class ServiceStaffDashboardController {

    @Autowired
    private ServiceStaffDashboardService dashboardService;

    // Hàm lấy ID staff hiện tại (hardcode cho test)
    private Integer getAuthenticatedStaffId() {
         //TODO: Thay bằng lấy ID từ Authentication khi security được setup
         Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
         if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
             return ((UserDetailsImpl) authentication.getPrincipal()).getId();
         }
         throw new RuntimeException("User not authenticated");
        //return 5; // HARDCODE cho test - Service Staff (đich vụ)
    }

    /** API lấy số liệu thống kê cho các thẻ dashboard */
    @GetMapping("/stats")
    public ResponseEntity<ServiceStaffStatsDTO> getDashboardStats() {
        Integer staffId = getAuthenticatedStaffId();
        ServiceStaffStatsDTO stats = dashboardService.getServiceStaffStats(staffId);
        return ResponseEntity.ok(stats);
    }

    /** API lấy dữ liệu cho biểu đồ */
    @GetMapping("/chart")
    public ResponseEntity<ChartDataDTO> getContractChartData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Integer staffId = getAuthenticatedStaffId();
        ChartDataDTO chartData = dashboardService.getServiceStaffChartData(staffId, startDate, endDate);
        return ResponseEntity.ok(chartData);
    }

    /** API lấy danh sách công việc gần đây */
    @GetMapping("/recent-tasks")
    public ResponseEntity<List<ContractDetailsDTO>> getRecentTasks(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "5") int limit) {
        Integer staffId = getAuthenticatedStaffId();
        List<ContractDetailsDTO> tasks = dashboardService.getRecentServiceStaffTasks(staffId, status, limit);
        return ResponseEntity.ok(tasks);
    }
}

