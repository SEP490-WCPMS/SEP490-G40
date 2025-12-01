package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ContractAnnulTransferRequestUpdateDTO {

    private ContractAnnulTransferRequest.ApprovalStatus approvalStatus; // PENDING/APPROVED/REJECTED

    private Integer approvedById;         // bắt buộc nếu APPROVED/REJECTED (validate ở service)

    private LocalDate approvalDate;       // thường set = LocalDate.now() khi duyệt

    private String notes;

    private String attachedEvidence;         // nếu muốn cập nhật file đính kèm

    private String rejectionReason; // lý do từ chối, nếu có
}
