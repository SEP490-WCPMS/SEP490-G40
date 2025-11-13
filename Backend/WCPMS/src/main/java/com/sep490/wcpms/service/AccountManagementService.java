package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateStaffRequestDTO;
import com.sep490.wcpms.dto.RoleDTO;
import com.sep490.wcpms.dto.StaffAccountResponseDTO;
import com.sep490.wcpms.dto.UpdateStaffRequestDTO;
import java.util.List;

public interface AccountManagementService {

    // Lấy danh sách vai trò có thể gán (ADMIN, STAFF...)
    List<RoleDTO> getAssignableRoles();

    // Lấy danh sách tất cả tài khoản nhân viên
    List<StaffAccountResponseDTO> getAllStaffAccounts();

    // Lấy chi tiết một tài khoản
    StaffAccountResponseDTO getStaffAccountById(Integer accountId);

    // Tạo tài khoản nhân viên mới
    StaffAccountResponseDTO createStaffAccount(CreateStaffRequestDTO requestDTO);

    // Cập nhật tài khoản nhân viên
    StaffAccountResponseDTO updateStaffAccount(Integer accountId, UpdateStaffRequestDTO requestDTO);

    // Vô hiệu hóa / Kích hoạt tài khoản
    StaffAccountResponseDTO setAccountStatus(Integer accountId, Integer status);
}