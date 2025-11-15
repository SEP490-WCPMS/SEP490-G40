package com.sep490.wcpms.controller;

import com.sep490.wcpms.service.NotificationQueryService;
import com.sep490.wcpms.security.jwt.JwtUtils;
import com.sep490.wcpms.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Controller xử lý polling fallback cho thông báo khi SSE timeout
 * SSE realtime notification: /api/service/notifications/stream-token (NotificationController)
 * Polling fallback: /api/service/notifications (endpoint này)
 */
@RestController
@RequestMapping("/api/service/notifications")
@RequiredArgsConstructor
@Slf4j
public class ServiceStaffNotificationController {

    private final NotificationQueryService notificationQueryService;
    private final JwtUtils jwtUtils;


    /**
     * Lịch sử thông báo (phân trang) - Polling fallback
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> list(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size,
                                                      HttpServletRequest request) {
        log.debug("[NOTIFICATION LIST] Polling request from: {}", request.getRemoteAddr());

        // Validate JWT từ Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[NOTIFICATION LIST] Missing or invalid Authorization header");
            throw new RuntimeException("Authorization header required: Bearer <token>");
        }

        String token = authHeader.substring(7);
        if (!jwtUtils.validateJwtToken(token)) {
            log.warn("[NOTIFICATION LIST] Invalid or expired token");
            throw new RuntimeException("Invalid or expired JWT token");
        }

        String username = jwtUtils.getUserNameFromJwtToken(token);
        Integer userId = jwtUtils.getUserIdFromJwtToken(token); // ✅ Extract userId
        log.debug("[NOTIFICATION LIST] Token valid - User: {}, ID: {}", username, userId);

        // --- Set SecurityContext so NotificationQueryServiceImpl.currentAccount() can resolve user ---
        // Use a lightweight UsernamePasswordAuthenticationToken with principal=username
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Page<NotificationDTO> result = notificationQueryService.getMyNotifications(page, size);
        return ResponseEntity.ok(result);
    }

    // Đếm số chưa đọc - Polling fallback
    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount(HttpServletRequest request) {
        log.debug("[NOTIFICATION UNREAD-COUNT] Polling request from: {}", request.getRemoteAddr());

        // Validate JWT từ Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[NOTIFICATION UNREAD-COUNT] Missing or invalid Authorization header");
            throw new RuntimeException("Authorization header required: Bearer <token>");
        }

        String token = authHeader.substring(7);
        if (!jwtUtils.validateJwtToken(token)) {
            log.warn("[NOTIFICATION UNREAD-COUNT] Invalid or expired token");
            throw new RuntimeException("Invalid or expired JWT token");
        }

        String username = jwtUtils.getUserNameFromJwtToken(token);
        log.debug("[NOTIFICATION UNREAD-COUNT] Token valid for user: {}", username);

        // Set SecurityContext here too for unreadCount path
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        long count = notificationQueryService.getMyUnreadCount();
        return ResponseEntity.ok(count);
    }

    // Đánh dấu 1 thông báo đã đọc
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationQueryService.markRead(id);
        return ResponseEntity.ok().build();
    }

    // Đánh dấu tất cả đã đọc
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead() {
        notificationQueryService.markAllRead();
        return ResponseEntity.ok().build();
    }
}
