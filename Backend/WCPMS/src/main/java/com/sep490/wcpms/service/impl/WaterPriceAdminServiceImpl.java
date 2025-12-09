package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.WaterPriceAdminResponseDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import com.sep490.wcpms.entity.WaterPrice;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.WaterPriceRepository;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import com.sep490.wcpms.service.WaterPriceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaterPriceAdminServiceImpl implements WaterPriceAdminService {

    private final WaterPriceRepository priceRepository;
    private final WaterPriceTypeRepository priceTypeRepository;

    @Override
    public Page<WaterPriceAdminResponseDTO> listAll(boolean includeInactive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<WaterPrice> result;
        if (includeInactive) {
            result = priceRepository.findAll(pageable);
        } else {
            result = priceRepository.findAllByStatus(WaterPrice.Status.ACTIVE, pageable);
        }
        return result.map(this::toDto);
    }

    @Override
    public WaterPriceAdminResponseDTO getById(Integer id) {
        WaterPrice p = priceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPrice not found: " + id));
        return toDto(p);
    }

    @Override
    public List<WaterPriceTypeAdminResponseDTO> getAvailablePriceTypes() {
        List<WaterPriceType> types = priceTypeRepository.findTypesWithoutActivePrice();
        return types.stream().map(t -> WaterPriceTypeAdminResponseDTO.builder()
                .id(t.getId())
                .typeName(t.getTypeName())
                .typeCode(t.getTypeCode())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WaterPriceAdminResponseDTO create(CreateWaterPriceRequestDTO req) {
        validatePriceData(req.getUnitPrice(), req.getEnvironmentFee(), req.getVatRate());
        WaterPriceType pt = priceTypeRepository.findById(req.getPriceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("PriceType not found: " + req.getPriceTypeId()));
        WaterPrice p = new WaterPrice();
        p.setPriceType(pt);
        p.setTypeName(pt.getTypeName());
        p.setUnitPrice(req.getUnitPrice());
        p.setEnvironmentFee(req.getEnvironmentFee() == null ? BigDecimal.ZERO : req.getEnvironmentFee());
        p.setVatRate(req.getVatRate());
        p.setEffectiveDate(req.getEffectiveDate());
        p.setApprovedBy(req.getApprovedBy());
        p.setStatus(WaterPrice.Status.ACTIVE);
        return toDto(priceRepository.save(p));
    }

    @Override
    @Transactional
    public WaterPriceAdminResponseDTO update(Integer id, UpdateWaterPriceRequestDTO req) {
        WaterPrice p = priceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("WaterPrice not found: " + id));
        if (req.getUnitPrice() != null) validatePositiveInteger(req.getUnitPrice(), "Đơn giá");
        if (req.getEnvironmentFee() != null) validatePositiveInteger(req.getEnvironmentFee(), "Phí môi trường");
        if (req.getVatRate() != null) validateVatRate(req.getVatRate());

        if (req.getPriceTypeId() != null) {
            WaterPriceType pt = priceTypeRepository.findById(req.getPriceTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("PriceType not found: " + req.getPriceTypeId()));
            p.setPriceType(pt);
            p.setTypeName(pt.getTypeName());
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
        return toDto(priceRepository.save(p));
    }

    private void validatePriceData(BigDecimal unitPrice, BigDecimal envFee, BigDecimal vatRate) {
        validatePositiveInteger(unitPrice, "Đơn giá");
        if (envFee != null) validatePositiveInteger(envFee, "Phí môi trường");
        validateVatRate(vatRate);
    }

    private void validatePositiveInteger(BigDecimal value, String fieldName) {
        if (value == null) return;
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(fieldName + " phải là số dương (> 0).");
        }
        if (value.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException(fieldName + " phải là số nguyên.");
        }
    }

    private void validateVatRate(BigDecimal vat) {
        if (vat == null) return;
        double val = vat.doubleValue();
        if (val < 1 || val > 10) {
            throw new IllegalArgumentException("VAT phải nằm trong khoảng từ 1 đến 10.");
        }
        if (val % 1 != 0) {
            throw new IllegalArgumentException("VAT phải là số tự nhiên.");
        }
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