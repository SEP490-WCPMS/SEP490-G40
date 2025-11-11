package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Account;
import lombok.Data;

@Data
public class StaffAccountResponseDTO {
    private Integer id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String roleName;
    private Account.Department department;
    private Integer status; // 1 = Active, 0 = Inactive

    // Hàm chuyển đổi từ Entity sang DTO
    public StaffAccountResponseDTO(Account account) {
        this.id = account.getId();
        this.username = account.getUsername();
        this.fullName = account.getFullName();
        this.email = account.getEmail();
        this.phone = account.getPhone();
        this.roleName = (account.getRole() != null) ? account.getRole().getRoleName().name() : null;
        this.department = account.getDepartment();
        this.status = account.getStatus();
    }
}