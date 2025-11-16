package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.ReadingRoute;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO (Data Transfer Object) rút gọn cho Bảng 4 (Reading Routes)
 * Dùng để hiển thị trong Dropdown (chọn tuyến).
 */
@Data
@NoArgsConstructor
public class ReadingRouteDTO {

    private Integer id;
    private String routeCode;
    private String routeName;
    private String assignedReaderName; // Tên Thu ngân (nếu có)

    // Constructor để map thủ công
    public ReadingRouteDTO(ReadingRoute route) {
        this.id = route.getId();
        this.routeCode = route.getRouteCode();
        this.routeName = route.getRouteName();

        if (route.getAssignedReader() != null) {
            this.assignedReaderName = route.getAssignedReader().getFullName();
        } else {
            this.assignedReaderName = "Chưa gán";
        }
    }
}