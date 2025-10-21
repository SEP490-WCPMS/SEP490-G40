package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.WaterPriceTypeDTO;
import com.sep490.wcpms.service.WaterPriceTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/water-price-types")
@CrossOrigin(origins = "http://localhost:3000")
public class WaterPriceTypeController {

    @Autowired
    private WaterPriceTypeService waterPriceTypeService;

    @GetMapping("/active")
    public ResponseEntity<List<WaterPriceTypeDTO>> getActivePriceTypes() {
        List<WaterPriceTypeDTO> activeTypes = waterPriceTypeService.getActivePriceTypes();
        return ResponseEntity.ok(activeTypes);
    }
}