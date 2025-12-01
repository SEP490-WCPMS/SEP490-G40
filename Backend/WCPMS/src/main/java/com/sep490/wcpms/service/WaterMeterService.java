package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;

import java.util.List;

public interface WaterMeterService {
    List<WaterMeterAdminResponseDTO> listAll(boolean includeRetired);
    WaterMeterAdminResponseDTO getById(Integer id);
    WaterMeterAdminResponseDTO create(CreateWaterMeterRequestDTO req);
    WaterMeterAdminResponseDTO update(Integer id, UpdateWaterMeterRequestDTO req);
    WaterMeterAdminResponseDTO setStatus(Integer id, String status);
}

