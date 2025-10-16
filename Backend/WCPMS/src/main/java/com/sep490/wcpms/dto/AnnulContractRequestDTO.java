package com.sep490.wcpms.dto;

import com.sep490.wcpms.util.Constant;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnulContractRequestDTO {

    private Integer id;

    private Integer contractId;
    private String contractNumber;  // tiện cho UI

    private String requestNumber;
    private LocalDate requestDate;
    private String reason;
    private String attachedFiles;

    private Integer requestedById;
    private String requestedByUsername; // hoặc fullname/email

    private Integer approvedById;
    private String approvedByUsername;

    private LocalDate approvalDate;
    private String approvalStatus;

    private String notes;

    private LocalDate createdAt;
    private LocalDate updatedAt;
}
