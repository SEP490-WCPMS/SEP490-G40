package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CreateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterPriceTypeRequestDTO;
import com.sep490.wcpms.dto.WaterPriceTypeAdminResponseDTO;
import com.sep490.wcpms.service.WaterPriceTypeAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page; // Import Page
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/water-price-types")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WaterPriceTypeAdminController {

    private final WaterPriceTypeAdminService service;

    @GetMapping
    public ResponseEntity<Page<WaterPriceTypeAdminResponseDTO>> list(
            @RequestParam(name = "includeInactive", required = false, defaultValue = "false") boolean includeInactive,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.listAll(includeInactive, page, size));
    }

    // ... (Các API khác giữ nguyên) ...
    @GetMapping("/{id}")
    public ResponseEntity<WaterPriceTypeAdminResponseDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<WaterPriceTypeAdminResponseDTO> create(@Valid @RequestBody CreateWaterPriceTypeRequestDTO req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WaterPriceTypeAdminResponseDTO> update(@PathVariable Integer id, @RequestBody UpdateWaterPriceTypeRequestDTO req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> setStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null) return ResponseEntity.badRequest().build();
        service.setStatus(id, status);
        return ResponseEntity.ok().build();
    }
}