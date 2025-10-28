package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountSummaryDTO {
    private Integer id;
    private String fullName;
    private String username;

    public static AccountSummaryDTO fromEntity(Account a) {
        if (a == null) return null;
        return new AccountSummaryDTO(a.getId(), a.getFullName(), a.getUsername());
    }
}

