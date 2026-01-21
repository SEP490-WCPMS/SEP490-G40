package com.sep490.wcpms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data // Lombok annotation để tự tạo getter, setter, toString...
public class ProfileUpdateRequestDTO {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;
    
    private String email;

    private String identityNumber;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;
}