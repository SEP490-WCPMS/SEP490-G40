package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CreateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.UpdateWaterMeterRequestDTO;
import com.sep490.wcpms.dto.WaterMeterAdminResponseDTO;
import com.sep490.wcpms.service.WaterMeterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/water-meters")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WaterMeterAdminController {

    private final WaterMeterService service;

    @GetMapping
    public ResponseEntity<List<WaterMeterAdminResponseDTO>> list(@RequestParam(name = "includeRetired", required = false, defaultValue = "false") boolean includeRetired) {
        return ResponseEntity.ok(service.listAll(includeRetired));
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

    // Soft delete / set status endpoint. Expect payload: {"status":"RETIRED"} or {"status":"IN_STOCK"}
    @PutMapping("/{id}/status")
    public ResponseEntity<WaterMeterAdminResponseDTO> setStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.setStatus(id, status));
    }
}

