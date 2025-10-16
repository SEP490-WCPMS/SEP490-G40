package com.sep490.wcpms.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ServiceStaffUpdateContractRequestDTO {

    // Chỉ chứa các trường mà Service Staff được phép cập nhật
    private String contractStatus;
    private LocalDate surveyDate;
    private LocalDate installationDate;
    private String notes;
    private Long technicalStaffId; // Thêm ID nhân viên kỹ thuật để gán việc
}