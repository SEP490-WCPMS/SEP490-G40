package com.sep490.wcpms.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SurveyReportApprovedEvent {
    private final Integer contractId;
    private final String contractNumber;
    private final Integer serviceStaffId;
    private final String customerName;
    private final LocalDateTime approvedAt;
}