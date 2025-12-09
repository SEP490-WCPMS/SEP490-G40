package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {
    private Integer id;
    private String fullName;
    // workload = current assigned tasks count (nullable)
    private Long workload;

    // Keep a simple 2-arg constructor used in existing code
    public AccountDTO(Integer id, String fullName) {
        this.id = id;
        this.fullName = fullName;
        this.workload = null;
    }
}