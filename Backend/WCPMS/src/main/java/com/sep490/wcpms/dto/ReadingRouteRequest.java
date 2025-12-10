package com.sep490.wcpms.dto;

import lombok.Data;

import java.util.List;

@Data
public class ReadingRouteRequest {
    private String routeCode;
    private String routeName;
    private String areaCoverage;
    private Integer assignedReaderId; // optional, can be null
    // --- MỚI ---
    private List<Integer> serviceStaffIds;
}
