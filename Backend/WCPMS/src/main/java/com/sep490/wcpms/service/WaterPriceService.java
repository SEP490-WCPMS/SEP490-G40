package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.WaterPriceDetailDTO;
import java.util.List;

public interface WaterPriceService {
    /**
     * Lấy chi tiết tất cả các bảng giá nước đang 'ACTIVE'
     */
    List<WaterPriceDetailDTO> getActiveWaterPriceDetails();
}