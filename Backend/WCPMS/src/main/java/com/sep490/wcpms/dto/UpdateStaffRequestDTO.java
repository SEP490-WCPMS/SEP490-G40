package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Account;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateStaffRequestDTO {
    @NotBlank(message = "Mã nhân viên không được để trống")
    private String staffCode;

    @NotBlank
    private String username;

    // Mật khẩu là TÙY CHỌN. Nếu rỗng/null, sẽ không cập nhật.
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    private String phone;

    @NotNull(message = "Vai trò không được để trống")
    private Integer roleId;

    private Account.Department department;

    @NotNull
    private Integer status; // 1 hoặc 0
}