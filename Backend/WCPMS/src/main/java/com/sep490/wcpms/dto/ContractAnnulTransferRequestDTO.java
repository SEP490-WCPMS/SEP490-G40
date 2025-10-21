package com.sep490.wcpms.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ContractAnnulTransferRequestDTO {

    private Integer id;

    private Integer contractId;
    private String contractNumber;  // tiện cho UI

    private String requestType;

    private String requestNumber;
    private LocalDate requestDate;
    private String reason;
    private String attachedEvidence;

    private Integer requestedById;
    private String requestedByUsername; // hoặc fullname/email

    private Integer approvedById;
    private String approvedByUsername;

    private LocalDate approvalDate;
    private String approvalStatus;

    //transfer only
    private Integer fromCustomerId;
    private Integer toCustomerId;

    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
