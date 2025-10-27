package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.AccountSummaryDTO;
import com.sep490.wcpms.entity.Role;

import java.util.List;

public interface AccountQueryService {
    List<AccountSummaryDTO> findByRole(Role.RoleName roleName);
}

