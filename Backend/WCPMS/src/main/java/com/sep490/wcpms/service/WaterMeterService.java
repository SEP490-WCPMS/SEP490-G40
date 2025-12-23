package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;
import org.springframework.data.domain.Page; // <-- Quan trọng: Import Page

import java.util.List;

public interface WaterMeterService {
    // SỬA DÒNG NÀY: Trả về Page, nhận tham số page, size
    Page<WaterMeterAdminResponseDTO> listAll(boolean includeMaintenance, String keyword, int page, int size);
    WaterMeterAdminResponseDTO getById(Integer id);
    WaterMeterAdminResponseDTO create(CreateWaterMeterRequestDTO req);
    WaterMeterAdminResponseDTO update(Integer id, UpdateWaterMeterRequestDTO req);
    WaterMeterAdminResponseDTO setStatus(Integer id, String status);
}