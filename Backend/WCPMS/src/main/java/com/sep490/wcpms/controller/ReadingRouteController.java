package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ReadingRouteRequest;
import com.sep490.wcpms.dto.ReadingRouteResponse;
import com.sep490.wcpms.service.ReadingRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reading-routes")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ReadingRouteController {

    private final ReadingRouteService service;

    // Các endpoint được bảo vệ bởi SecurityConfig (đòi hỏi authority ACCOUNTING_STAFF)
    @PostMapping
    public ResponseEntity<ReadingRouteResponse> create(@RequestBody ReadingRouteRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingRouteResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ReadingRouteResponse>> list(
            @RequestParam(name = "includeInactive", required = false, defaultValue = "false") boolean includeInactive,
            @RequestParam(name = "search", required = false, defaultValue = "") String search
    ) {
        // Truyền search vào service
        return ResponseEntity.ok(service.list(includeInactive, search));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReadingRouteResponse> update(@PathVariable Integer id, @RequestBody ReadingRouteRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }


}
