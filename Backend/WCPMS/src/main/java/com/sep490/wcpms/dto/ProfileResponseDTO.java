package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponseDTO {
    private Integer id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String street;
    private String district;
    private String province;
}