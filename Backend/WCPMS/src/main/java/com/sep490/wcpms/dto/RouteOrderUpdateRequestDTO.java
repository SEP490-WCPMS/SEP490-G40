package com.sep490.wcpms.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * DTO để nhận yêu cầu Cập nhật Thứ tự Tuyến đọc (Route Order)
 * từ trang Kế toán.
 */
@Data
public class RouteOrderUpdateRequestDTO {
    /**
     * Danh sách các ID (của WaterServiceContract - Bảng 9)
     * theo đúng thứ tự MỚI mà người dùng đã sắp xếp.
     * * Ví dụ: [ 105, 102, 108 ]
     * (Nghĩa là HĐ 105 -> routeOrder=1, HĐ 102 -> routeOrder=2, ...)
     */
    private List<Integer> orderedContractIds;
}