package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;
import com.sep490.wcpms.service.WaterMeterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page; // Import Page
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/water-meters")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WaterMeterAdminController {

    private final WaterMeterService service;

    @GetMapping
    public ResponseEntity<Page<WaterMeterAdminResponseDTO>> list(
            @RequestParam(name = "includeRetired", required = false, defaultValue = "false") boolean includeRetired, // Lưu ý: tham số này bạn đặt tên là includeRetired hay includeMaintenance thì giữ nguyên cho đồng bộ
            @RequestParam(name = "search", required = false, defaultValue = "") String keyword, // <-- Thêm cái này
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        // Truyền keyword xuống service
        return ResponseEntity.ok(service.listAll(includeRetired, keyword, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WaterMeterAdminResponseDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<WaterMeterAdminResponseDTO> create(@Valid @RequestBody CreateWaterMeterRequestDTO req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WaterMeterAdminResponseDTO> update(@PathVariable Integer id, @RequestBody UpdateWaterMeterRequestDTO req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<WaterMeterAdminResponseDTO> setStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.setStatus(id, status));
    }
}