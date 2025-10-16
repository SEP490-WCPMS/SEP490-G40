package com.sep490.wcpms.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnulContractRequestCreateDTO {

    @NotNull
    private Integer contractId;

    @NotBlank
    @Size(max = 50)
    private String requestNumber;

    @NotNull
    private LocalDate requestDate;

    @NotBlank
    private String reason;

    private String attachedFiles; // có thể là JSON string

    @NotNull
    private Integer requestedById;

    private String notes;
}