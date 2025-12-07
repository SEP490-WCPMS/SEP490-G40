package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressCreateRequestDTO {

    @NotNull(message = "Customer ID is required")
    private Integer customerId;

    @NotBlank(message = "Street is required")
    private String street; // Số nhà, tên đường

    @NotNull(message = "Ward ID is required")
    private Integer wardId;

    private String notes; // Ghi chú
}

