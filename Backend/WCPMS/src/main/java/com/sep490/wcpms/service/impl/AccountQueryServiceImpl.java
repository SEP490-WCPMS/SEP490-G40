package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.AccountSummaryDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.service.AccountQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountQueryServiceImpl implements AccountQueryService {

    private final AccountRepository accountRepository;

    @Override
    public List<AccountSummaryDTO> findByRole(Role.RoleName roleName) {
        List<Account> accounts = accountRepository.findByRole_RoleName(roleName);
        return accounts.stream().map(AccountSummaryDTO::fromEntity).collect(Collectors.toList());
    }
}

