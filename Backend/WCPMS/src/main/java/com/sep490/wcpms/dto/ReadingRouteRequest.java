package com.sep490.wcpms.dto;

import lombok.Data;

@Data
public class ReadingRouteRequest {
    private String routeCode;
    private String routeName;
    private String areaCoverage;
    private Integer assignedReaderId; // optional, can be null
}
