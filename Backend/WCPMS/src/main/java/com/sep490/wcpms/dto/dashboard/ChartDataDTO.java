package com.sep490.wcpms.dto.dashboard;
import lombok.Data;
import java.util.List;
@Data
public class ChartDataDTO {
    private List<String> labels; // Ngày tháng
    private List<Long> surveyCompletedCounts; // Số lượng gửi khảo sát (PENDING)
    private List<Long> installationCompletedCounts; // Số lượng đã duyệt (APPROVED)
    private List<Long> pendingSignCounts; // Số lượng gửi ký (PENDING_SIGN)
    private List<Long> activeCounts; // Số lượng đã đi vào hoạt động (ACTIVE)
}