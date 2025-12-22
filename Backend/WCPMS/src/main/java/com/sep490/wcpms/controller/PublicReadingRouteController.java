package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ReadingRouteResponse;
import com.sep490.wcpms.service.ReadingRouteService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
            @RequestParam(name = "search", required = false, defaultValue = "") String search // <-- 1. Thêm tham số search
    ) {
        try {
            logger.info("PublicReadingRouteController.listPublic called includeInactive={}, search={}", includeInactive, search);

            // <-- 2. Truyền tham số search vào service
            List<ReadingRouteResponse> list = readingRouteService.list(includeInactive, search);

            logger.info("PublicReadingRouteController.listPublic returning {} routes", list == null ? 0 : list.size());

            if (list == null || list.isEmpty()) {
                // fallback sample to help frontend until DB issue resolved
                logger.warn("ReadingRouteService returned empty list; returning fallback sample routes");
                ReadingRouteResponse r1 = ReadingRouteResponse.builder()
                        .id(1)
                        .routeCode("R001")
                        .routeName("Fallback Route 1")
                        .areaCoverage("Area A")
                        .status("ACTIVE")
                        .build();
                ReadingRouteResponse r2 = ReadingRouteResponse.builder()
                        .id(2)
                        .routeCode("R002")
                        .routeName("Fallback Route 2")
                        .areaCoverage("Area B")
                        .status("ACTIVE")
                        .build();
                return ResponseEntity.ok(List.of(r1, r2));
            }
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            logger.error("Error in listPublic", ex);
            // On exception, return fallback sample to avoid frontend blocking
            ReadingRouteResponse r1 = ReadingRouteResponse.builder()
                    .id(1)
                    .routeCode("R001")
                    .routeName("Fallback Route 1")
                    .areaCoverage("Area A")
                    .status("ACTIVE")
                    .build();
            ReadingRouteResponse r2 = ReadingRouteResponse.builder()
                    .id(2)
                    .routeCode("R002")
                    .routeName("Fallback Route 2")
                    .areaCoverage("Area B")
                    .status("ACTIVE")
                    .build();
            return ResponseEntity.ok(List.of(r1, r2));
        }
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