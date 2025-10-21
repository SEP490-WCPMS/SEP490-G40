package com.sep490.wcpms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContractRequestDTO {

    @NotNull(message = "Account ID không được để trống")
    private Integer accountId;

    @NotNull(message = "Vui lòng chọn một loại hình sử dụng")
    private Integer priceTypeId;

    @Min(value = 1, message = "Số người sử dụng phải ít nhất là 1")
    private Integer occupants;

    private String notes;
}