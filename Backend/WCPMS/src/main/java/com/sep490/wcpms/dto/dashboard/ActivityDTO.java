package com.sep490.wcpms.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDTO {
    private String id;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime time;

    // display name of actor (full name or customer name)
    private String actor;

    // actor type: STAFF | CUSTOMER | SYSTEM
    private String actorType;

    // optional id of actor (account id for staff, customer id for customer)
    private Integer actorId;

    // optional role/department string for staff (e.g., SERVICE, TECHNICAL, CASHIER, ACCOUNTING)
    private String actorRole;

    // NEW: initiator info (the originator of the action, e.g., customer who signed)
    private String initiatorName;
    private String initiatorType; // CUSTOMER | STAFF | SYSTEM
    private Integer initiatorId;

    private String action;

    // Subject of the activity (the object being acted upon)
    private String subjectType; // CONTRACT | INVOICE | PAYMENT | CUSTOMER | etc.
    private String subjectId;   // e.g., "REQ-4-1764538319756", "HD-xxx"
    private String payload;     // optional JSON or additional details
}
