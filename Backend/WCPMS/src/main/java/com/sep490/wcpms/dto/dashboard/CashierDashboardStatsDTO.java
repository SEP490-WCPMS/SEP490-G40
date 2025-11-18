package com.sep490.wcpms.dto.dashboard;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO chứa các chỉ số KPI cho Dashboard Thu ngân.
 */
@Data
@NoArgsConstructor
public class CashierDashboardStatsDTO {

    /** 1. Số đồng hồ đã ghi HÔM NAY */
    private long readingsTodayCount;

    /** 2. Tổng tiền mặt (CASH) đã thu HÔM NAY */
    private BigDecimal cashCollectedToday;

    /** 3. Số Hóa đơn (Pending/Overdue) trên tuyến của Thu ngân */
    private long pendingInvoicesOnMyRoutesCount;

    /** 4. Tổng SỐ TIỀN của các HĐ (Pending/Overdue) trên tuyến */
    private BigDecimal pendingInvoicesOnMyRoutesAmount;
}
