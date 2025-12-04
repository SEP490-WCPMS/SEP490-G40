package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;
import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterMeterRepository;
import com.sep490.wcpms.service.WaterMeterService;
import lombok.RequiredArgsConstructor;
// --- IMPORT ĐÚNG CHO PHÂN TRANG ---
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
// ----------------------------------
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WaterMeterServiceImpl implements WaterMeterService {

    private final WaterMeterRepository repository;

    @Override
    public Page<WaterMeterAdminResponseDTO> listAll(boolean includeRetired, int page, int size) {
        // Tạo Pageable từ Spring Data (không phải java.awt)
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        Page<WaterMeter> pageResult;
        if (includeRetired) {
            pageResult = repository.findAll(pageable);
        } else {
            pageResult = repository.findByMeterStatusNot(WaterMeter.MeterStatus.RETIRED, pageable);
        }

        return pageResult.map(this::toDto);
    }

    // ... (Các hàm getById, create, update, setStatus, toDto GIỮ NGUYÊN NHƯ CŨ) ...
    // Copy lại phần thân các hàm đó từ code tôi gửi trước đó.

    @Override
    public WaterMeterAdminResponseDTO getById(Integer id) {
        WaterMeter w = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));
        return toDto(w);
    }

    @Override
    @Transactional
    public WaterMeterAdminResponseDTO create(CreateWaterMeterRequestDTO req) {
        if (repository.existsByMeterCode(req.getMeterCode())) {
            throw new IllegalArgumentException("Mã đồng hồ '" + req.getMeterCode() + "' đã tồn tại.");
        }
        if (repository.existsBySerialNumber(req.getSerialNumber())) {
            throw new IllegalArgumentException("Số Serial '" + req.getSerialNumber() + "' đã tồn tại.");
        }

        WaterMeter w = new WaterMeter();
        w.setMeterCode(req.getMeterCode());
        w.setSerialNumber(req.getSerialNumber());
        w.setMeterType(req.getMeterType());
        w.setMeterName(req.getMeterName());
        w.setSupplier(req.getSupplier());
        w.setSize(req.getSize());
        if (req.getMultiplier() != null) w.setMultiplier(req.getMultiplier());
        w.setPurchasePrice(req.getPurchasePrice());
        w.setMaxReading(req.getMaxReading());
        w.setNextMaintenanceDate(req.getNextMaintenanceDate());
        if (req.getMeterStatus() != null) {
            try { w.setMeterStatus(WaterMeter.MeterStatus.valueOf(req.getMeterStatus())); } catch (Exception ignore) {}
        }
        return toDto(repository.save(w));
    }

    @Override
    @Transactional
    public WaterMeterAdminResponseDTO update(Integer id, UpdateWaterMeterRequestDTO req) {
        WaterMeter w = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));

        if (req.getMeterCode() != null && repository.existsByMeterCodeAndIdNot(req.getMeterCode(), id)) {
            throw new IllegalArgumentException("Mã đồng hồ đã tồn tại.");
        }
        if (req.getSerialNumber() != null && repository.existsBySerialNumberAndIdNot(req.getSerialNumber(), id)) {
            throw new IllegalArgumentException("Số Serial đã tồn tại.");
        }

        if (req.getMeterCode() != null) w.setMeterCode(req.getMeterCode());
        if (req.getSerialNumber() != null) w.setSerialNumber(req.getSerialNumber());
        if (req.getMeterType() != null) w.setMeterType(req.getMeterType());
        if (req.getMeterName() != null) w.setMeterName(req.getMeterName());
        if (req.getSupplier() != null) w.setSupplier(req.getSupplier());
        if (req.getSize() != null) w.setSize(req.getSize());
        if (req.getMultiplier() != null) w.setMultiplier(req.getMultiplier());
        if (req.getPurchasePrice() != null) w.setPurchasePrice(req.getPurchasePrice());
        if (req.getMaxReading() != null) w.setMaxReading(req.getMaxReading());
        if (req.getNextMaintenanceDate() != null) w.setNextMaintenanceDate(req.getNextMaintenanceDate());
        if (req.getMeterStatus() != null) {
            try { w.setMeterStatus(WaterMeter.MeterStatus.valueOf(req.getMeterStatus())); } catch (Exception ignore) {}
        }
        return toDto(repository.save(w));
    }

    @Override
    @Transactional
    public WaterMeterAdminResponseDTO setStatus(Integer id, String status) {
        WaterMeter w = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));
        try {
            w.setMeterStatus(WaterMeter.MeterStatus.valueOf(status));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid meter status: " + status);
        }
        return toDto(repository.save(w));
    }

    private WaterMeterAdminResponseDTO toDto(WaterMeter w) {
        return WaterMeterAdminResponseDTO.builder()
                .id(w.getId())
                .meterCode(w.getMeterCode())
                .serialNumber(w.getSerialNumber())
                .meterType(w.getMeterType())
                .meterName(w.getMeterName())
                .supplier(w.getSupplier())
                .size(w.getSize())
                .multiplier(w.getMultiplier())
                .purchasePrice(w.getPurchasePrice())
                .maxReading(w.getMaxReading())
                .installationDate(w.getInstallationDate())
                .nextMaintenanceDate(w.getNextMaintenanceDate())
                .meterStatus(w.getMeterStatus() == null ? null : w.getMeterStatus().name())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}