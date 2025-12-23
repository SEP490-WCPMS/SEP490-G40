package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;
import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterMeterRepository;
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.service.WaterMeterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WaterMeterServiceImpl implements WaterMeterService {

    private final WaterMeterRepository repository;
    private final ActivityLogService activityLogService;

    // ... (Các hàm listAll, getById, create, update giữ nguyên như cũ) ...

    @Override
    public Page<WaterMeterAdminResponseDTO> listAll(boolean includeMaintenance, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        // Gọi hàm search mới (đã bao gồm cả logic lọc includeMaintenance trong Query)
        Page<WaterMeter> pageResult = repository.searchWaterMeters(keyword, includeMaintenance, pageable);

        return pageResult.map(this::toDto);
    }

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
        WaterMeter saved = repository.save(w);

        // --- GHI LOG ---
        try {
            ActivityLog log = new ActivityLog();
            log.setSubjectType("WATER_METER");
            log.setSubjectId(saved.getMeterCode());
            log.setAction("METER_IMPORTED");
            log.setPayload("Serial: " + saved.getSerialNumber() + ", NCC: " + saved.getSupplier());
            log.setActorType("ADMIN");
            activityLogService.save(log);
        } catch (Exception ex) {}

        return toDto(saved);
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

    // --- SỬA LOGIC HÀM NÀY ---
    @Override
    @Transactional
    public WaterMeterAdminResponseDTO setStatus(Integer id, String statusStr) {
        WaterMeter w = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + id));

        WaterMeter.MeterStatus newStatus;
        try {
            newStatus = WaterMeter.MeterStatus.valueOf(statusStr);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + statusStr);
        }

        // LOGIC CHECK: Chỉ cho phép xóa (RETIRED) nếu đang là IN_STOCK
        if (newStatus == WaterMeter.MeterStatus.UNDER_MAINTENANCE) {
            if (w.getMeterStatus() != WaterMeter.MeterStatus.IN_STOCK && w.getMeterStatus() != WaterMeter.MeterStatus.BROKEN) {
                throw new IllegalArgumentException("Chỉ có thể xóa đồng hồ đang ở trạng thái 'Trong kho' hoặc 'Bị hỏng' . Đồng hồ này đang: " + w.getMeterStatus());
            }
        }

        w.setMeterStatus(newStatus);
        WaterMeter saved = repository.save(w);

        // --- GHI LOG ĐỔI TRẠNG THÁI ---
        try {
            ActivityLog log = new ActivityLog();
            log.setSubjectType("WATER_METER");
            log.setSubjectId(saved.getMeterCode());
            log.setAction("METER_STATUS_CHANGED");
            log.setPayload("New Status: " + newStatus);
            log.setActorType("ADMIN");
            activityLogService.save(log);
        } catch (Exception ex) {}

        return toDto(saved);
    }
    // -------------------------

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