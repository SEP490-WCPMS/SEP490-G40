package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.AccountSummaryDTO;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.service.AccountQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountQueryService accountQueryService;

    // GET /api/accounts?role=TECHNICAL_STAFF hoặc roleName=TECHNICAL_STAFF
    @GetMapping
    public List<AccountSummaryDTO> findAccountsByRole(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "roleName", required = false) String roleName
    ) {
        String value = role != null ? role : roleName;
        if (value == null) {
            // Mặc định trả về kỹ thuật viên nếu FE không truyền param (để tiện dropdown)
            return accountQueryService.findByRole(Role.RoleName.TECHNICAL_STAFF);
        }
        Role.RoleName rn = Role.RoleName.valueOf(value.toUpperCase());
        return accountQueryService.findByRole(rn);
    }

    // GET /api/accounts/technical-staff
    @GetMapping("/technical-staff")
    public List<AccountSummaryDTO> findTechnicalStaff() {
        return accountQueryService.findByRole(Role.RoleName.TECHNICAL_STAFF);
    }
}
