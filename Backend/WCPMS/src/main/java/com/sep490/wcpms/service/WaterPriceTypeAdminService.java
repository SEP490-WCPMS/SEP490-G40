package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface WaterPriceTypeAdminService {
    Page<WaterPriceTypeAdminResponseDTO> listAll(boolean includeInactive, int page, int size);
    WaterPriceTypeAdminResponseDTO getById(Integer id);
    WaterPriceTypeAdminResponseDTO create(CreateWaterPriceTypeRequestDTO req);
    WaterPriceTypeAdminResponseDTO update(Integer id, UpdateWaterPriceTypeRequestDTO req);
    void setStatus(Integer id, String status);
}

