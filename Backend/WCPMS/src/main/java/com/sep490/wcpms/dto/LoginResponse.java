// LoginResponse.java
package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Account.Department;
import com.sep490.wcpms.entity.Role.RoleName;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private Integer id;
    private String username;
    private String fullName;
    private RoleName roleName; // Sử dụng RoleName enum trực tiếp
    private Department department;
    private String token;
}