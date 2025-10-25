package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.WaterPriceDetailDTO;
import com.sep490.wcpms.entity.WaterPrice;
import com.sep490.wcpms.repository.WaterPriceRepository;
import com.sep490.wcpms.service.WaterPriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WaterPriceServiceImpl implements WaterPriceService {

    @Autowired
    private WaterPriceRepository waterPriceRepository;

    @Override
    public List<WaterPriceDetailDTO> getActiveWaterPriceDetails() {
        // Lấy tất cả giá đang "ACTIVE" (IN HOA, khớp với Entity)
        List<WaterPrice> prices = waterPriceRepository.findAllByStatus(WaterPrice.Status.ACTIVE);
        return prices.stream()
                .map(WaterPriceDetailDTO::new)
                .collect(Collectors.toList());
    }
}