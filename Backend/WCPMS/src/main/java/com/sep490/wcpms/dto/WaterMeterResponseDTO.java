package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterMeterResponseDTO {
    private String installationImageBase64; // ảnh lắp đặt mới nhất theo contractId
    private String installedMeterCode;      // meter_code của đồng hồ có trạng thái INSTALLED
}
