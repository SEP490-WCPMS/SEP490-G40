package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ContractDetailsDTO; // Giả định dùng DTO này cho bảng
import com.sep490.wcpms.dto.dashboard.ChartDataDTO; // DTO mới cho biểu đồ
import com.sep490.wcpms.dto.dashboard.TechnicalStatsDTO; // DTO mới cho thẻ
import com.sep490.wcpms.service.TechnicalDashboardService; // Service mới
//import com.sep490.wcpms.security.services.UserDetailsImpl; // Để lấy ID user
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/technical/dashboard")
@CrossOrigin(origins = "http://localhost:5173") // Hoặc cấu hình global
public class TechnicalDashboardController {

    @Autowired
    private TechnicalDashboardService dashboardService;

    // Hàm lấy ID staff (giống các controller khác)
    private Integer getAuthenticatedStaffId() {
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
//            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
//        }
//        // Nên ném lỗi nếu không xác thực được
//        throw new RuntimeException("User not authenticated");
        return 1; // <<<<< HARDCODE ĐỂ TEST - CẦN THAY THẾ
    }

    /** API lấy số liệu cho các thẻ thống kê */
    @GetMapping("/stats")
    public ResponseEntity<TechnicalStatsDTO> getDashboardStats() {
        Integer staffId = getAuthenticatedStaffId();
        TechnicalStatsDTO stats = dashboardService.getTechnicalStats(staffId);
        return ResponseEntity.ok(stats);
    }

    /** API lấy dữ liệu cho biểu đồ */
    @GetMapping("/chart")
    public ResponseEntity<ChartDataDTO> getContractChartData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Integer staffId = getAuthenticatedStaffId();
        ChartDataDTO chartData = dashboardService.getTechnicalChartData(staffId, startDate, endDate);
        return ResponseEntity.ok(chartData);
    }

    /** API lấy danh sách công việc gần đây (kết hợp chờ khảo sát + chờ lắp đặt) */
    @GetMapping("/recent-tasks")
    public ResponseEntity<List<ContractDetailsDTO>> getRecentTasks(
            @RequestParam(required = false) String status, // Optional filter
            @RequestParam(defaultValue = "5") int limit) {
        Integer staffId = getAuthenticatedStaffId();
        List<ContractDetailsDTO> tasks = dashboardService.getRecentTechnicalTasks(staffId, status, limit);
        return ResponseEntity.ok(tasks);
    }
}
