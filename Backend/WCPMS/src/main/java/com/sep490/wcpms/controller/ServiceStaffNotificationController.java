package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.NotificationDTO;
import com.sep490.wcpms.service.NotificationQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.CrossOrigin;

/**
 * Polling controller for Service Staff notifications (history + unread + mark-read).
 * Uses Spring Security authentication (JWT filter) to identify current user.
 */
@RestController
@RequestMapping("/api/service/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ServiceStaffNotificationController {

    private final NotificationQueryService notificationQueryService;

    /**
     * Lấy lịch sử thông báo (phân trang)
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> list(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        log.debug("[NOTIFICATION LIST] Fetching notifications page={}, size={}", page, size);
        Page<NotificationDTO> result = notificationQueryService.getMyNotifications(page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount() {
        log.debug("[NOTIFICATION UNREAD-COUNT] Fetching unread count");
        long count = notificationQueryService.getMyUnreadCount();
        return ResponseEntity.ok(count);
    }

    // Đánh dấu 1 thông báo đã đọc
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        log.debug("[NOTIFICATION MARK-READ] id={}", id);
        notificationQueryService.markRead(id);
        return ResponseEntity.ok().build();
    }

    // Đánh dấu tất cả đã đọc
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead() {
        log.debug("[NOTIFICATION MARK-ALL-READ]");
        notificationQueryService.markAllRead();
        return ResponseEntity.ok().build();
    }
}
