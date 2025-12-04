package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.WaterPriceAdminResponseDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import org.springframework.data.domain.Page;
import java.util.List;

public interface WaterPriceAdminService {
    // --- SỬA LẠI DÒNG NÀY: Thêm int page, int size ---
    Page<WaterPriceAdminResponseDTO> listAll(boolean includeInactive, int page, int size);

    WaterPriceAdminResponseDTO getById(Integer id);
    WaterPriceAdminResponseDTO create(CreateWaterPriceRequestDTO req);
    WaterPriceAdminResponseDTO update(Integer id, UpdateWaterPriceRequestDTO req);
    WaterPriceAdminResponseDTO setStatus(Integer id, String status);
    List<WaterPriceTypeAdminResponseDTO> getAvailablePriceTypes();
}