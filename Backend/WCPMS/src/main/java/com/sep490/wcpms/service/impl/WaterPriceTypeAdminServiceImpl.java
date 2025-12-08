package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import com.sep490.wcpms.service.WaterPriceTypeAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WaterPriceTypeAdminServiceImpl implements WaterPriceTypeAdminService {

    private final WaterPriceTypeRepository repository;

    @Override
    public Page<WaterPriceTypeAdminResponseDTO> listAll(boolean includeInactive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<WaterPriceType> pageResult;

        if (includeInactive) {
            pageResult = repository.findAll(pageable);
        } else {
            pageResult = repository.findAllByStatus(WaterPriceType.Status.ACTIVE, pageable);
        }
        return pageResult.map(this::toDto);
    }

    @Override
    public WaterPriceTypeAdminResponseDTO getById(Integer id) {
        WaterPriceType t = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPriceType not found: " + id));
        return toDto(t);
    }

    @Override
    @Transactional
    public WaterPriceTypeAdminResponseDTO create(CreateWaterPriceTypeRequestDTO req) {
        // 1. CHECK TRÙNG
        if (repository.existsByTypeName(req.getTypeName())) {
            throw new IllegalArgumentException("Tên loại giá '" + req.getTypeName() + "' đã tồn tại.");
        }
        if (repository.existsByTypeCode(req.getTypeCode())) {
            throw new IllegalArgumentException("Mã loại giá '" + req.getTypeCode() + "' đã tồn tại.");
        }

        // 2. CHECK TỈ LỆ (100 - 200)
        validatePercentageRate(req.getPercentageRate());

        WaterPriceType t = new WaterPriceType();
        t.setTypeName(req.getTypeName());
        t.setTypeCode(req.getTypeCode());
        t.setDescription(req.getDescription());
        t.setUsagePurpose(req.getUsagePurpose());
        t.setPercentageRate(req.getPercentageRate());
        t.setStatus(WaterPriceType.Status.ACTIVE);
        WaterPriceType saved = repository.save(t);
        return toDto(saved);
    }

    @Override
    @Transactional
    public WaterPriceTypeAdminResponseDTO update(Integer id, UpdateWaterPriceTypeRequestDTO req) {
        WaterPriceType t = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPriceType not found: " + id));

        // 1. CHECK TRÙNG KHI UPDATE
        if (req.getTypeName() != null && repository.existsByTypeNameAndIdNot(req.getTypeName(), id)) {
            throw new IllegalArgumentException("Tên loại giá '" + req.getTypeName() + "' đã tồn tại.");
        }
        if (req.getTypeCode() != null && repository.existsByTypeCodeAndIdNot(req.getTypeCode(), id)) {
            throw new IllegalArgumentException("Mã loại giá '" + req.getTypeCode() + "' đã tồn tại.");
        }

        // 2. CHECK TỈ LỆ
        if (req.getPercentageRate() != null) {
            validatePercentageRate(req.getPercentageRate());
        }

        if (req.getTypeName() != null) t.setTypeName(req.getTypeName());
        if (req.getTypeCode() != null) t.setTypeCode(req.getTypeCode());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getUsagePurpose() != null) t.setUsagePurpose(req.getUsagePurpose());
        if (req.getPercentageRate() != null) t.setPercentageRate(req.getPercentageRate());
        if (req.getStatus() != null) {
            try { t.setStatus(WaterPriceType.Status.valueOf(req.getStatus())); } catch (Exception ignore) {}
        }
        WaterPriceType saved = repository.save(t);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void setStatus(Integer id, String status) {
        WaterPriceType t = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPriceType not found: " + id));
        try { t.setStatus(WaterPriceType.Status.valueOf(status)); } catch (Exception ex) { throw new IllegalArgumentException("Invalid status: " + status); }
        repository.save(t);
    }

    // Hàm helper để validate tỉ lệ
    private void validatePercentageRate(BigDecimal rate) {
        if (rate != null) {
            double val = rate.doubleValue();
            if (val < 100.0 || val > 200.0) {
                throw new IllegalArgumentException("Tỷ lệ phần trăm phải là số tự nhiên từ 100 đến 200.");
            }
            // Kiểm tra số tự nhiên (không có phần thập phân lẻ, ví dụ 100.5 -> fail, 100.0 -> ok)
            if (val % 1 != 0) {
                throw new IllegalArgumentException("Tỷ lệ phần trăm phải là số tự nhiên (không có phần thập phân).");
            }
        }
    }

    private WaterPriceTypeAdminResponseDTO toDto(WaterPriceType t) {
        return WaterPriceTypeAdminResponseDTO.builder()
                .id(t.getId())
                .typeName(t.getTypeName())
                .typeCode(t.getTypeCode())
                .description(t.getDescription())
                .usagePurpose(t.getUsagePurpose())
                .percentageRate(t.getPercentageRate())
                .status(t.getStatus() == null ? null : t.getStatus().name())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}