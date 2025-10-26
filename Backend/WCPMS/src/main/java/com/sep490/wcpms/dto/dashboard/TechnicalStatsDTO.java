package com.sep490.wcpms.dto.dashboard;
import lombok.Data;
@Data
public class TechnicalStatsDTO {
    private long pendingSurvey;      // Chờ khảo sát (status = PENDING)
    private long pendingInstallation; // Chờ lắp đặt (status = SIGNED)
    private long surveyCompleted;    // Đã khảo sát (status = PENDING_SURVEY_REVIEW)
    private long installationCompleted; // Đã lắp đặt (status = ACTIVE)
}