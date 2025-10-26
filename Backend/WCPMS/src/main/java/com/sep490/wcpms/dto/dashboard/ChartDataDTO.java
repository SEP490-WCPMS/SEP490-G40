package com.sep490.wcpms.dto.dashboard;
import lombok.Data;
import java.util.List;
@Data
public class ChartDataDTO {
    private List<String> labels; // Ngày tháng
    private List<Long> surveyCompletedCounts; // Số lượng khảo sát hoàn thành
    private List<Long> installationCompletedCounts; // Số lượng lắp đặt hoàn thành
}