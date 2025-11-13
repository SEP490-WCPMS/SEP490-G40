package com.sep490.wcpms.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SurveyReportSubmittedEvent {
    private final Integer contractId;
    private final String contractNumber;
    private final Integer technicalStaffId;
    private final Integer serviceStaffId; // có thể null
    private final String customerName;
    private final LocalDateTime submittedAt;
}

