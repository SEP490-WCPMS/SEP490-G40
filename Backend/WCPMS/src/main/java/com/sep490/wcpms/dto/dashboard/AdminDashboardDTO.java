package com.sep490.wcpms.dto.dashboard;

import lombok.Data;

@Data
public class AdminDashboardDTO {
    private long usersCount;
    private long activeContracts;
    private long pendingContracts;
    private long unpaidInvoices;
    private long overdueInvoices;
    private long revenueMTD; // in VND
    private long newUsersLast7Days;
}

