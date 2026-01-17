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
    // Use LocalDateTime to match entity (request_date is LocalDateTime)
    private LocalDateTime requestDate;
    private String reason;
    private String attachedEvidence;

    private Integer requestedById;
    private String requestedByUsername; // hoặc fullname/email

    private Integer approvedById;
    private String approvedByUsername;

    // Nhân viên Service
    private Integer serviceStaffId;
    private String serviceStaffName;

    // Use LocalDateTime to match entity (approval_date is LocalDateTime)
    private LocalDateTime approvalDate;
    private String approvalStatus;

    //transfer only
    private Integer fromCustomerId;
    private Integer toCustomerId;

    private String fromCustomerName;
    private String toCustomerName;

    private String fromCustomerCode;
    private String toCustomerCode;

    private String fromCustomerPhone;
    private String toCustomerPhone;

    // (optional) address cho FE hiển thị
    private String fromCustomerAddress;
    private String toCustomerAddress;

    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String rejectionReason;
    private String status;
    private LocalDateTime processedDate;
    private Integer requesterId;
    private String requesterName;
    private LocalDateTime createdDate;
}
