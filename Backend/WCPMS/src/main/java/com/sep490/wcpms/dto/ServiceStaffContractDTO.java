package com.sep490.wcpms.dto;

import lombok.Data;

@Data
public class ServiceStaffContractDTO {
    private Integer id;
    private String contractNumber;
    private String contractStatus;
    private String customerName;
    private String customerCode;
}
