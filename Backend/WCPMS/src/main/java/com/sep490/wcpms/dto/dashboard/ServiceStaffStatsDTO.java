package com.sep490.wcpms.dto.dashboard;

import lombok.Data;

@Data
public class ServiceStaffStatsDTO {
    private Long draftCount;              // Số nháp chưa gửi
    private Long pendingTechnicalCount;   // Số đang chờ kỹ thuật khảo sát (PENDING)
    private Long pendingSurveyReviewCount; // Số chờ duyệt báo cáo (PENDING_SURVEY_REVIEW)
    private Long approvedCount;           // Số đã duyệt (APPROVED)
    private Long pendingSignCount;        // Số chờ ký (PENDING_SIGN)
    private Long signedCount;             // Số đã ký (SIGNED)
    private Long activeCount;             // Số đã đi vào hoạt động (ACTIVE)
}

