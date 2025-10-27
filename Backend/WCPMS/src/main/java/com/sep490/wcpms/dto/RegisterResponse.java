package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {
    private Integer id;
    private String username;
    private String fullName;
    private String customerCode;
    private String roleName;
    private String message;
}