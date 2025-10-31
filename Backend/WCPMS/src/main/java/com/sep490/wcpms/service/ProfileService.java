package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ChangePasswordRequestDTO;
import com.sep490.wcpms.dto.ProfileResponseDTO;
import com.sep490.wcpms.dto.ProfileUpdateRequestDTO;

public interface ProfileService {
    ProfileResponseDTO getProfileById(Integer id);
    ProfileResponseDTO updateProfile(Integer id, ProfileUpdateRequestDTO updateRequestDTO);
    // --- THÊM PHƯƠNG THỨC MỚI ---
    void changePassword(Integer id, ChangePasswordRequestDTO changePasswordRequestDTO);
}