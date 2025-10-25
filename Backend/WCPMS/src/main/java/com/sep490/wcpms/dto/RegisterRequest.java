package com.sep490.wcpms.dto;

import lombok.Data;

// Request này không cần Role vì nó sẽ được gán mặc định là CUSTOMER
@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String phone;
    private String fullName;
}