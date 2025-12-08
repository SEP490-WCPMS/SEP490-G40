package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerResponseDTO {
    private Integer accountId;
    private Integer customerId;
    private String customerCode;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private Integer status; // 1: Active, 0: Inactive
}