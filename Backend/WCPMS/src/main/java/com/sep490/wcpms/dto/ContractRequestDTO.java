package com.sep490.wcpms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ContractRequestDTO {

    private Integer accountId;

    @NotNull(message = "Vui lòng chọn một loại hình sử dụng")
    private Integer priceTypeId;

    @Min(value = 1, message = "Số người sử dụng phải ít nhất là 1")
    private Integer occupants;

    private String notes;

    @NotNull(message = "Vui lòng chọn một tuyến đọc")
    private Integer routeId;

    private String fullName;
    // Validate số điện thoại VN: Bắt đầu bằng 03, 05, 07, 08, 09 và có tổng 10 số
    @Pattern(regexp = "^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$",
            message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;
    private String address;
}