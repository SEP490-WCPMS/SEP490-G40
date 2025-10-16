package com.sep490.wcpms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data // Lombok annotation để tự tạo getter, setter, toString...
public class ProfileUpdateRequestDTO {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Số nhà không được để trống")
    private String address;

    @NotBlank(message = "Đường/Phố không được để trống")
    private String street;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;
}