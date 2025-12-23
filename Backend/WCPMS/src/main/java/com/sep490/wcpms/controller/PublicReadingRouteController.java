package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ReadingRouteResponse;
import com.sep490.wcpms.service.ReadingRouteService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/reading-routes")
@RequiredArgsConstructor
@CrossOrigin("*")
public class PublicReadingRouteController {

    private static final Logger logger = LoggerFactory.getLogger(PublicReadingRouteController.class);

    private final ReadingRouteService readingRouteService;

    // Public endpoint for frontend/customer to list active reading routes
    @GetMapping
    public ResponseEntity<List<ReadingRouteResponse>> listPublic(
            @RequestParam(name = "includeInactive", required = false, defaultValue = "false") boolean includeInactive,
            @RequestParam(name = "search", required = false, defaultValue = "") String search
    ) {
        // Gọi service với page 0, size lớn (ví dụ 1000) để lấy hết
        Page<ReadingRouteResponse> pageResult = readingRouteService.list(includeInactive, search, 0, 1000);
        return ResponseEntity.ok(pageResult.getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingRouteResponse> getById(@PathVariable Integer id) {
        try {
            logger.info("PublicReadingRouteController.getById called id={}", id);
            ReadingRouteResponse resp = readingRouteService.getById(id);
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            logger.error("Error in getById", ex);
            return ResponseEntity.notFound().build();
        }
    }

    // Diagnostic endpoint: returns sample reading routes (no DB needed)
    @GetMapping("/test")
    public ResponseEntity<List<ReadingRouteResponse>> testList() {
        try {
            logger.info("PublicReadingRouteController.testList called");
            ReadingRouteResponse r1 = ReadingRouteResponse.builder()
                    .id(1)
                    .routeCode("R001")
                    .routeName("Test Route 1")
                    .areaCoverage("Area A")
                    .status("ACTIVE")
                    .build();
            ReadingRouteResponse r2 = ReadingRouteResponse.builder()
                    .id(2)
                    .routeCode("R002")
                    .routeName("Test Route 2")
                    .areaCoverage("Area B")
                    .status("ACTIVE")
                    .build();
            return ResponseEntity.ok(List.of(r1, r2));
        } catch (Exception ex) {
            logger.error("Error in testList", ex);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }
}