package com.sep490.wcpms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserProfileDTO {
    // --- Thông tin từ Entity Account ---
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role; // Lấy từ account.getRole().getRoleName()
    private String department; // Lấy từ account.getDepartment().name()

    // --- Thông tin từ Entity Customer (nếu có) ---
    private String customerCode;
    private String identityNumber;
    private String address; // Sẽ gộp từ các trường địa chỉ
    private String street;
    private String district;
    private String province;
}