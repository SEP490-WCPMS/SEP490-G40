package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.WaterPriceAdminResponseDTO;

import java.util.List;

public interface WaterPriceAdminService {
    List<WaterPriceAdminResponseDTO> listAll(boolean includeInactive);
    WaterPriceAdminResponseDTO getById(Integer id);
    WaterPriceAdminResponseDTO create(CreateWaterPriceRequestDTO req);
    WaterPriceAdminResponseDTO update(Integer id, UpdateWaterPriceRequestDTO req);
    WaterPriceAdminResponseDTO setStatus(Integer id, String status);
}

