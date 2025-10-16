package com.sep490.wcpms.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnulContractRequestUpdateDTO {

    @NotNull
    private String approvalStatus; // PENDING/APPROVED/REJECTED

    private Integer approvedById;         // bắt buộc nếu APPROVED/REJECTED (validate ở service)

    private LocalDate approvalDate;       // thường set = LocalDate.now() khi duyệt

    private String notes;

    private String attachedFiles;         // nếu muốn cập nhật file đính kèm
}
