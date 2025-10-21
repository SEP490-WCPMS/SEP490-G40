package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.WaterPriceTypeDTO;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import com.sep490.wcpms.service.WaterPriceTypeService; // Import interface
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service // Đánh dấu đây là một Service
public class WaterPriceTypeServiceImpl implements WaterPriceTypeService { // Triển khai interface

    @Autowired
    private WaterPriceTypeRepository waterPriceTypeRepository;

    @Override // Ghi đè phương thức từ interface
    public List<WaterPriceTypeDTO> getActivePriceTypes() {
        List<WaterPriceType> activeTypes = waterPriceTypeRepository.findAllByStatus(WaterPriceType.Status.ACTIVE);
        return activeTypes.stream()
                .map(WaterPriceTypeDTO::new)
                .collect(Collectors.toList());
    }
}