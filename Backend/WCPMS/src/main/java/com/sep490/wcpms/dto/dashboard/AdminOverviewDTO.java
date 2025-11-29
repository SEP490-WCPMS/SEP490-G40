package com.sep490.wcpms.dto.dashboard;

public class AdminOverviewDTO {
    private long usersCount;
    private long activeContracts;
    private long pendingContracts;
    private long unpaidInvoices;
    private long overdueInvoices;
    private long revenueMTD;
    private long newUsersLast7Days;

    // getters & setters
    public long getUsersCount() { return usersCount; }
    public void setUsersCount(long usersCount) { this.usersCount = usersCount; }
    public long getActiveContracts() { return activeContracts; }
    public void setActiveContracts(long activeContracts) { this.activeContracts = activeContracts; }
    public long getPendingContracts() { return pendingContracts; }
    public void setPendingContracts(long pendingContracts) { this.pendingContracts = pendingContracts; }
    public long getUnpaidInvoices() { return unpaidInvoices; }
    public void setUnpaidInvoices(long unpaidInvoices) { this.unpaidInvoices = unpaidInvoices; }
    public long getOverdueInvoices() { return overdueInvoices; }
    public void setOverdueInvoices(long overdueInvoices) { this.overdueInvoices = overdueInvoices; }
    public long getRevenueMTD() { return revenueMTD; }
    public void setRevenueMTD(long revenueMTD) { this.revenueMTD = revenueMTD; }
    public long getNewUsersLast7Days() { return newUsersLast7Days; }
    public void setNewUsersLast7Days(long newUsersLast7Days) { this.newUsersLast7Days = newUsersLast7Days; }
}

