package com.sep490.wcpms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

/**
 * DTO báo cáo SỐ LƯỢNG đồng hồ đã ghi (từ Bảng 15) theo ngày.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor // Bắt buộc cho @Query
public class DailyReadingCountDTO {

    private LocalDate date; // Ngày
    private Long readingCount; // Số lượng đã ghi
}
