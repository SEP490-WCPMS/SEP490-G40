package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReadingRouteResponse {
    private Integer id;
    private String routeCode;
    private String routeName;
    private String areaCoverage;
    private Integer assignedReaderId;
    private String assignedReaderName;

    // --- MỚI ---
    private List<StaffDto> serviceStaffs;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Inner class để hiển thị gọn nhẹ
    @Data
    @Builder
    public static class StaffDto {
        private Integer id;
        private String fullName;
        private String username;
    }
}