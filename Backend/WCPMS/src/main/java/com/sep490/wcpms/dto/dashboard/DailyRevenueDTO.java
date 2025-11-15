package com.sep490.wcpms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO để báo cáo Doanh thu (từ Bảng 19 Receipts) theo ngày.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor // Bắt buộc phải có cho câu @Query
public class DailyRevenueDTO {

    private LocalDate date; // Ngày
    private BigDecimal totalRevenue; // Tổng doanh thu của ngày đó
}