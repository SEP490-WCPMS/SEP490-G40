package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.WaterPriceTypeDTO;
import java.util.List;

public interface WaterPriceTypeService {
    /**
     * Lấy danh sách tất cả các loại giá nước đang ở trạng thái ACTIVE.
     *
     * @return Danh sách WaterPriceTypeDTO
     */
    List<WaterPriceTypeDTO> getActivePriceTypes();
}