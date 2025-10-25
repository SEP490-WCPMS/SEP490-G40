package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.WaterPriceDetailDTO;
import com.sep490.wcpms.service.WaterPriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/water-prices")
@CrossOrigin(origins = "http://localhost:3000") // Cho phép front-end gọi
public class WaterPriceController {

    @Autowired
    private WaterPriceService waterPriceService; // Tiêm interface

    @GetMapping("/active-details")
    public ResponseEntity<List<WaterPriceDetailDTO>> getActivePriceDetails() {
        List<WaterPriceDetailDTO> details = waterPriceService.getActiveWaterPriceDetails();
        return ResponseEntity.ok(details);
    }
}