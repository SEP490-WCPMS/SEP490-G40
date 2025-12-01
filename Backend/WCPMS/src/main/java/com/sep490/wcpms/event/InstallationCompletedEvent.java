package com.sep490.wcpms.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Sự kiện phát sinh khi Kỹ thuật hoàn tất lắp đặt (chuyển SIGNED -> ACTIVE).
 * Được publish từ TechnicalStaffServiceImpl sau khi lưu dữ liệu thành công.
 */
@Getter
@AllArgsConstructor
public class InstallationCompletedEvent {
    private final Integer contractId;
    private final String contractNumber;
    private final Integer technicalStaffId;
    private final Integer serviceStaffId; // có thể null nếu chưa gán
    private final String customerName;
    private final LocalDateTime completedAt;
}