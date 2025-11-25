package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;
import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterMeterRepository;
import com.sep490.wcpms.service.WaterMeterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaterMeterServiceImpl implements WaterMeterService {

    private final WaterMeterRepository repository;

    @Override
    public List<WaterMeterAdminResponseDTO> listAll(boolean includeRetired) {
        List<WaterMeter> list = repository.findAll();
        if (!includeRetired) {
            list = list.stream()
                    .filter(w -> w.getMeterStatus() != null && !w.getMeterStatus().name().equalsIgnoreCase("RETIRED"))
                    .collect(Collectors.toList());
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public WaterMeterAdminResponseDTO getById(Integer id) {
        WaterMeter w = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));
        return toDto(w);
    }

    @Override
    @Transactional
    public WaterMeterAdminResponseDTO create(CreateWaterMeterRequestDTO req) {
        WaterMeter w = new WaterMeter();
        w.setMeterCode(req.getMeterCode());
        w.setSerialNumber(req.getSerialNumber());
        w.setMeterType(req.getMeterType());
        w.setMeterName(req.getMeterName());
        w.setSupplier(req.getSupplier());
        w.setSize(req.getSize());
        w.setMultiplier(req.getMultiplier() == null ? w.getMultiplier() : req.getMultiplier());
        w.setPurchasePrice(req.getPurchasePrice());
        w.setMaxReading(req.getMaxReading());
        w.setInstallationDate(req.getInstallationDate());
        w.setNextMaintenanceDate(req.getNextMaintenanceDate());
        // If provided parse enum, else default remains
        if (req.getMeterStatus() != null) {
            try {
                w.setMeterStatus(WaterMeter.MeterStatus.valueOf(req.getMeterStatus()));
            } catch (Exception ignore) {}
        }
        WaterMeter saved = repository.save(w);
        return toDto(saved);
    }

    @Override
    @Transactional
    public WaterMeterAdminResponseDTO update(Integer id, UpdateWaterMeterRequestDTO req) {
        WaterMeter w = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));
        if (req.getMeterCode() != null) w.setMeterCode(req.getMeterCode());
        if (req.getSerialNumber() != null) w.setSerialNumber(req.getSerialNumber());
        if (req.getMeterType() != null) w.setMeterType(req.getMeterType());
        if (req.getMeterName() != null) w.setMeterName(req.getMeterName());
        if (req.getSupplier() != null) w.setSupplier(req.getSupplier());
        if (req.getSize() != null) w.setSize(req.getSize());
        if (req.getMultiplier() != null) w.setMultiplier(req.getMultiplier());
        if (req.getPurchasePrice() != null) w.setPurchasePrice(req.getPurchasePrice());
        if (req.getMaxReading() != null) w.setMaxReading(req.getMaxReading());
        if (req.getInstallationDate() != null) w.setInstallationDate(req.getInstallationDate());
        if (req.getNextMaintenanceDate() != null) w.setNextMaintenanceDate(req.getNextMaintenanceDate());
        if (req.getMeterStatus() != null) {
            try { w.setMeterStatus(WaterMeter.MeterStatus.valueOf(req.getMeterStatus())); } catch (Exception ignore) {}
        }
        WaterMeter saved = repository.save(w);
        return toDto(saved);
    }

    @Override
    @Transactional
    public WaterMeterAdminResponseDTO setStatus(Integer id, String status) {
        WaterMeter w = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));
        try {
            WaterMeter.MeterStatus ms = WaterMeter.MeterStatus.valueOf(status);
            w.setMeterStatus(ms);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid meter status: " + status);
        }
        WaterMeter saved = repository.save(w);
        return toDto(saved);
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

