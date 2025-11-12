package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.AccountSummaryDTO;
import com.sep490.wcpms.dto.CustomerDTO;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.service.AccountQueryService;
import com.sep490.wcpms.service.CustomerQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountQueryService accountQueryService;
    private final CustomerQueryService customerQueryService;

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

    // GET /api/accounts/cashiers
    @GetMapping("/cashiers")
    public List<AccountSummaryDTO> findCashiers() {
        return accountQueryService.findByRole(Role.RoleName.CASHIER_STAFF);
    }

    // GET /api/accounts/customer?customerName=xxx&identityNumber=yyy
    @GetMapping("/customer")
    public List<CustomerDTO> findCustomer(
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String identityNumber) {
        return customerQueryService.findCustomers(customerName, identityNumber);
    }

    @GetMapping("/{id}")
    public AccountSummaryDTO getAccountById(@PathVariable Integer id) {
        return accountQueryService.findById(id);
    }

    @GetMapping("/customer/{customerId}")
    public CustomerDTO getCustomerById(@PathVariable Integer customerId) {
        return customerQueryService.findById(customerId);
    }
}