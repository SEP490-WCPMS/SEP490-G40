package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ProfileResponseDTO;
import com.sep490.wcpms.dto.ProfileUpdateRequestDTO;

public interface ProfileService {
    ProfileResponseDTO getProfileByAccountId(Long accountId);
    ProfileResponseDTO updateProfile(Long accountId, ProfileUpdateRequestDTO updateRequestDTO);
}