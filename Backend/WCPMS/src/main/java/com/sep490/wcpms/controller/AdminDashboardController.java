package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.dashboard.AdminChartDataDTO;
import com.sep490.wcpms.dto.dashboard.AdminDashboardDTO;
import com.sep490.wcpms.dto.dashboard.NameValueDTO;
import com.sep490.wcpms.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService dashboardService;

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminDashboardDTO> getOverview(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        AdminDashboardDTO dto = dashboardService.getOverview(from, to);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/charts/revenue")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminChartDataDTO> getRevenueChart(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(name = "groupBy", required = false, defaultValue = "day") String groupBy
    ) {
        AdminChartDataDTO dto = dashboardService.getRevenueChart(from, to, groupBy);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/charts/contracts-by-status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<NameValueDTO>> getContractsByStatus(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<NameValueDTO> list = dashboardService.getContractsByStatus(from, to);
        return ResponseEntity.ok(list);
    }
}
