package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.StaffProfileDTO;

public interface StaffProfileService {
    StaffProfileDTO getStaffProfile(Integer accountId);
}