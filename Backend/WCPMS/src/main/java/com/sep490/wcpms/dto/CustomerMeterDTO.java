package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO rút gọn hiển thị đồng hồ đang hoạt động của Khách hàng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerMeterDTO {
    private Integer meterId; // ID của WaterMeter (Bảng 12)
    private String meterCode; // Mã đồng hồ (M001)
    private String address; // Địa chỉ lắp đặt (Lấy từ Customer/Contract)
}