package com.sep490.wcpms.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ContractAnnulTransferRequestCreateDTO {

    @NotNull
    private Integer contractId;

    @NotBlank // "annul" | "transfer"
    private String requestType;

    @NotBlank
    @Size(max = 50)
    private String requestNumber;

    @NotNull
    private LocalDate requestDate;

    @NotBlank
    private String reason;

    private String attachedEvidence; // có thể là JSON string

    @NotNull
    private Integer requestedById;

    private String notes;

    //transfer only
    private Integer fromCustomerId;
    private Integer toCustomerId;
}