package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CreateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceRequestDTO;
import com.sep490.wcpms.dto.WaterPriceAdminResponseDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import com.sep490.wcpms.service.WaterPriceAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/water-prices")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WaterPriceAdminController {

    private final WaterPriceAdminService service;

    @GetMapping
    public ResponseEntity<Page<WaterPriceAdminResponseDTO>> list(
            @RequestParam(name = "includeInactive", required = false, defaultValue = "false") boolean includeInactive,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.listAll(includeInactive, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WaterPriceAdminResponseDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/available-types")
    public ResponseEntity<List<WaterPriceTypeAdminResponseDTO>> getAvailableTypes() {
        return ResponseEntity.ok(service.getAvailablePriceTypes());
    }

    @PostMapping
    public ResponseEntity<WaterPriceAdminResponseDTO> create(@Valid @RequestBody CreateWaterPriceRequestDTO req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WaterPriceAdminResponseDTO> update(@PathVariable Integer id, @RequestBody UpdateWaterPriceRequestDTO req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<WaterPriceAdminResponseDTO> setStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.setStatus(id, status));
    }
}