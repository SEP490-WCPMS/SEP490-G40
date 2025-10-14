package com.sep490.wcpms.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    // Chỉ chứa các trường người dùng có thể thay đổi
    private String email;
    private String phone;
    private String address;
    private String district;
    private String province;

}