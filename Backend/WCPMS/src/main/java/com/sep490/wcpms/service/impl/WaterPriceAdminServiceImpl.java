package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.WaterPriceAdminResponseDTO;
import com.sep490.wcpms.entity.WaterPrice;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterPriceRepository;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import com.sep490.wcpms.service.WaterPriceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaterPriceAdminServiceImpl implements WaterPriceAdminService {

    private final WaterPriceRepository priceRepository;
    private final WaterPriceTypeRepository priceTypeRepository;

    @Override
    public List<WaterPriceAdminResponseDTO> listAll(boolean includeInactive) {
        List<WaterPrice> list = priceRepository.findAll();
        if (!includeInactive) {
            list = list.stream().filter(p -> p.getStatus() == WaterPrice.Status.ACTIVE).collect(Collectors.toList());
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public WaterPriceAdminResponseDTO getById(Integer id) {
        WaterPrice p = priceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPrice not found: " + id));
        return toDto(p);
    }

    @Override
    @Transactional
    public WaterPriceAdminResponseDTO create(CreateWaterPriceRequestDTO req) {
        WaterPriceType pt = priceTypeRepository.findById(req.getPriceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("PriceType not found: " + req.getPriceTypeId()));
        WaterPrice p = new WaterPrice();
        p.setPriceType(pt);
        p.setTypeName(req.getTypeName());
        p.setUnitPrice(req.getUnitPrice());
        p.setEnvironmentFee(req.getEnvironmentFee() == null ? p.getEnvironmentFee() : req.getEnvironmentFee());
        p.setVatRate(req.getVatRate());
        p.setEffectiveDate(req.getEffectiveDate());
        p.setApprovedBy(req.getApprovedBy());
        p.setStatus(WaterPrice.Status.PENDING);
        WaterPrice saved = priceRepository.save(p);
        return toDto(saved);
    }

    @Override
    @Transactional
    public WaterPriceAdminResponseDTO update(Integer id, UpdateWaterPriceRequestDTO req) {
        WaterPrice p = priceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPrice not found: " + id));
        if (req.getPriceTypeId() != null) {
            WaterPriceType pt = priceTypeRepository.findById(req.getPriceTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("PriceType not found: " + req.getPriceTypeId()));
            p.setPriceType(pt);
        }
        if (req.getTypeName() != null) p.setTypeName(req.getTypeName());
        if (req.getUnitPrice() != null) p.setUnitPrice(req.getUnitPrice());
        if (req.getEnvironmentFee() != null) p.setEnvironmentFee(req.getEnvironmentFee());
        if (req.getVatRate() != null) p.setVatRate(req.getVatRate());
        if (req.getEffectiveDate() != null) p.setEffectiveDate(req.getEffectiveDate());
        if (req.getApprovedBy() != null) p.setApprovedBy(req.getApprovedBy());
        if (req.getStatus() != null) {
            try { p.setStatus(WaterPrice.Status.valueOf(req.getStatus())); } catch (Exception ignore) {}
        }
        WaterPrice saved = priceRepository.save(p);
        return toDto(saved);
    }

    @Override
    @Transactional
    public WaterPriceAdminResponseDTO setStatus(Integer id, String status) {
        WaterPrice p = priceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPrice not found: " + id));
        try { p.setStatus(WaterPrice.Status.valueOf(status)); } catch (Exception ex) { throw new IllegalArgumentException("Invalid status: " + status); }
        WaterPrice saved = priceRepository.save(p);
        return toDto(saved);
    }

    private WaterPriceAdminResponseDTO toDto(WaterPrice p) {
        return WaterPriceAdminResponseDTO.builder()
                .id(p.getId())
                .priceTypeId(p.getPriceType() == null ? null : p.getPriceType().getId())
                .priceTypeName(p.getPriceType() == null ? null : p.getPriceType().getTypeName())
                .typeName(p.getTypeName())
                .unitPrice(p.getUnitPrice())
                .environmentFee(p.getEnvironmentFee())
                .vatRate(p.getVatRate())
                .effectiveDate(p.getEffectiveDate())
                .approvedBy(p.getApprovedBy())
                .status(p.getStatus() == null ? null : p.getStatus().name())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

