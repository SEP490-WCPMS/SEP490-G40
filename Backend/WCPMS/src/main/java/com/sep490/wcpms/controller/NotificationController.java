package com.sep490.wcpms.controller;

import com.sep490.wcpms.websocket.ConnectedUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

/**
 * Notification Controller - minimal REST endpoints (health + active connections)
 */
@RestController
@RequestMapping("/api/service/notifications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@Slf4j
@RequiredArgsConstructor
public class NotificationController {

    private final ConnectedUserService connectedUserService;

    /**
     * REST: Get active connections/health - keep simple health check
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "OK",
                "timestamp", new Date().toString()
        );
    }

    @GetMapping("/active-connections")
    public Map<String, Object> activeConnections() {
        return Map.of(
                "activeConnections", connectedUserService.count(),
                "usernames", connectedUserService.list()
        );
    }

}
