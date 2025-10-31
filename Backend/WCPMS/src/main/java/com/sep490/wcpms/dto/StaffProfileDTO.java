package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffProfileDTO {

    private Integer accountId;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String roleName;
    private Account.Department department;
    private Integer status;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;

    // Hàm tiện ích để chuyển đổi từ Entity sang DTO
    public static StaffProfileDTO fromEntity(Account account) {
        if (account == null) {
            return null;
        }
        return new StaffProfileDTO(
                account.getId(),
                account.getFullName(),
                account.getUsername(),
                account.getEmail(),
                account.getPhone(),
                account.getRole() != null ? account.getRole().getRoleName().name() : null,
                account.getDepartment(),
                account.getStatus(),
                account.getLastLogin(),
                account.getCreatedAt()
        );
    }
}