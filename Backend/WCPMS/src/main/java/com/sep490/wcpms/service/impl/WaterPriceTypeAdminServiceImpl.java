package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import com.sep490.wcpms.service.WaterPriceTypeAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaterPriceTypeAdminServiceImpl implements WaterPriceTypeAdminService {

    private final WaterPriceTypeRepository repository;

    @Override
    public List<WaterPriceTypeAdminResponseDTO> listAll(boolean includeInactive) {
        List<WaterPriceType> list;
        if (includeInactive) {
            list = repository.findAll();
        } else {
            list = repository.findAllByStatus(WaterPriceType.Status.ACTIVE);
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public WaterPriceTypeAdminResponseDTO getById(Integer id) {
        WaterPriceType t = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPriceType not found: " + id));
        return toDto(t);
    }

    @Override
    @Transactional
    public WaterPriceTypeAdminResponseDTO create(CreateWaterPriceTypeRequestDTO req) {
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

