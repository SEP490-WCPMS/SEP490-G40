package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReadingRouteResponse {
    private Integer id;
    private String routeCode;
    private String routeName;
    private String areaCoverage;
    private Integer assignedReaderId;
    private String assignedReaderName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
