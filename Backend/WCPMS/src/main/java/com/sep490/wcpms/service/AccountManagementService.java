package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateStaffRequestDTO;
import com.sep490.wcpms.dto.RoleDTO;
import com.sep490.wcpms.dto.StaffAccountResponseDTO;
import com.sep490.wcpms.dto.UpdateStaffRequestDTO;
import com.sep490.wcpms.entity.Account;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AccountManagementService {

    // Lấy danh sách vai trò có thể gán (ADMIN, STAFF...)
    List<RoleDTO> getAssignableRoles();

    // Lấy danh sách tất cả tài khoản nhân viên
    // Sửa hàm này: Thêm tham số page, size, department
    Page<StaffAccountResponseDTO> getAllStaffAccounts(int page, int size, Account.Department department);

    // Lấy chi tiết một tài khoản
    StaffAccountResponseDTO getStaffAccountById(Integer accountId);

    // Tạo tài khoản nhân viên mới
    StaffAccountResponseDTO createStaffAccount(CreateStaffRequestDTO requestDTO);

    // Cập nhật tài khoản nhân viên
    StaffAccountResponseDTO updateStaffAccount(Integer accountId, UpdateStaffRequestDTO requestDTO);

    // Vô hiệu hóa / Kích hoạt tài khoản
    StaffAccountResponseDTO setAccountStatus(Integer accountId, Integer status);
}