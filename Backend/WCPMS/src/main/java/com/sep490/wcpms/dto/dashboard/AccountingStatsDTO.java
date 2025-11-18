package com.sep490.wcpms.dto.dashboard;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO chứa các chỉ số KPI cho Dashboard Kế toán.
 */
@Data
@NoArgsConstructor
public class AccountingStatsDTO {

    /** 1. (To-do) Số phí dịch vụ (Bảng 14) đang chờ lập hóa đơn */
    private long unbilledFeesCount;

    /** 2. Số Hóa đơn (Bảng 17) đang PENDING hoặc OVERDUE */
    private long pendingInvoicesCount;

    /** 3. Tổng SỐ TIỀN của các HĐ PENDING/OVERDUE */
    private BigDecimal pendingInvoicesAmount;

    /** 4. Số Hóa đơn đã QUÁ HẠN (OVERDUE) */
    private long overdueInvoicesCount;

    // (Bạn có thể thêm: Tổng doanh thu tháng này...)
}