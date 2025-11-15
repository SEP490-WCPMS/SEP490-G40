package com.sep490.wcpms.controller;

import com.sep490.wcpms.security.jwt.JwtUtils;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.dto.NotificationDTO;
import com.sep490.wcpms.service.NotificationStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

/**
 * 🔔 SSE Notification Controller
 * Quản lý Server-Sent Events (SSE) cho real-time notifications
 *
 * Frontend kết nối qua: /api/service/notifications/stream-token?token=JWT_TOKEN
 * Backend gửi events khi có thông báo mới (ví dụ: khách hàng ký hợp đồng)
 */
@RestController
@RequestMapping("/api/service/notifications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@Slf4j
public class NotificationController {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private NotificationStorageService notificationStorageService;

    // ✅ Static map để lưu trữ emitters (shared across all instances)
    private static final Map<Integer, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * ✅ MAIN SSE ENDPOINT
     * Frontend gọi: GET /api/service/notifications/stream-token?token=eyJhbGc...
     *
     * Quy trình:
     * 1. Xác thực JWT token
     * 2. Lấy userId từ token
     * 3. Tạo SSE connection
     * 4. Gửi "init" event để báo Frontend kết nối thành công
     * 5. Giữ kết nối mở để nhận events từ Backend
     */
    @GetMapping(path = "/stream-token", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamWithToken(@RequestParam(name = "token", required = true) String token) {
        log.info("[SSE] 🔌 Yêu cầu kết nối stream với token");

        try {
            // 1️⃣ Xác thực JWT token
            if (!jwtUtils.validateJwtToken(token)) {
                log.error("[SSE] ❌ Token không hợp lệ");
                throw new RuntimeException("Token không hợp lệ");
            }

            // 2️⃣ Lấy username từ token
            String username = jwtUtils.getUserNameFromJwtToken(token);
            log.info("[SSE] Username từ token: {}", username);

            // 3️⃣ Lấy userId từ username
            Integer userId = accountRepository.findByUsername(username)
                    .map(account -> account.getId())
                    .orElseThrow(() -> new RuntimeException("User không tìm thấy: " + username));

            log.info("[SSE] UserId: {}", userId);

            // 4️⃣ Tạo SseEmitter (kết nối SSE)
            SseEmitter emitter = new SseEmitter(300000L); // 5 phút timeout

            // 5️⃣ Lưu emitter vào map để gửi thông báo sau này
            emitters.put(userId, emitter);
            log.info("[SSE] 🔌 User {} kết nối thành công. Tổng emitters: {}", userId, emitters.size());

            // 6️⃣ Gửi event "init" để báo Frontend kết nối thành công
            try {
                emitter.send(SseEmitter.event()
                        .id("init-" + UUID.randomUUID().toString())
                        .name("init")
                        .data("Kết nối SSE thành công")
                        .reconnectTime(5000)
                        .build());
                log.info("[SSE] ✅ Init event gửi thành công cho user {}", userId);
            } catch (IOException e) {
                log.error("[SSE] ❌ Lỗi gửi init event: {}", e.getMessage());
            }

            // 7️⃣ Xử lý khi user ngắt kết nối (hoàn tất)
            emitter.onCompletion(() -> {
                emitters.remove(userId);
                log.info("[SSE] ⭕ User {} ngắt kết nối (completion). Tổng emitters: {}", userId, emitters.size());
            });

            // 8️⃣ Xử lý khi timeout
            emitter.onTimeout(() -> {
                emitters.remove(userId);
                log.warn("[SSE] ⏱️ User {} timeout. Tổng emitters: {}", userId, emitters.size());
            });

            // 9️⃣ Xử lý lỗi
            emitter.onError(throwable -> {
                emitters.remove(userId);
                log.error("[SSE] ❌ Lỗi SSE cho user {}: {}", userId, throwable.getMessage());
            });

            return emitter;

        } catch (Exception e) {
            log.error("[SSE] ❌ Lỗi kết nối SSE: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi SSE: " + e.getMessage());
        }
    }

    /**
     * ✅ Static method: Gửi thông báo cho một user cụ thể qua SSE
     * Được gọi từ ContractNotificationEventListener.onCustomerSigned()
     *
     * @param serviceStaffId - ID của Service Staff nhận thông báo
     * @param notification - Dữ liệu thông báo (type, message, contractId, etc)
     */
    public static void broadcastNotification(Integer serviceStaffId, Map<String, Object> notification) {
        if (emitters.containsKey(serviceStaffId)) {
            try {
                SseEmitter emitter = emitters.get(serviceStaffId);
                emitter.send(SseEmitter.event()
                        .id(UUID.randomUUID().toString())
                        .name("notification")
                        .data(notification)
                        .build());
                System.out.println("[SSE] 📤 Gửi thông báo cho user " + serviceStaffId + ": " +
                        notification.getOrDefault("message", "N/A"));
            } catch (IOException e) {
                System.err.println("[SSE] ❌ Lỗi gửi thông báo cho user " + serviceStaffId + ": " + e.getMessage());
                emitters.remove(serviceStaffId);
            }
        } else {
            System.out.println("[SSE] ⚠️ User " + serviceStaffId + " không kết nối SSE (không có emitter)");
        }
    }

    /**
     * ✅ Static method: Gửi thông báo cho TẤT CẢ user đang kết nối qua SSE
     *
     * @param notification - Dữ liệu thông báo
     */
    public static void broadcastToAll(Map<String, Object> notification) {
        System.out.println("[SSE] 📢 Broadcast thông báo cho " + emitters.size() + " users");

        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .id(UUID.randomUUID().toString())
                        .name("notification")
                        .data(notification)
                        .build());
                System.out.println("[SSE] Gửi cho user " + userId);
            } catch (IOException e) {
                System.err.println("[SSE] Lỗi gửi cho user " + userId + ": " + e.getMessage());
                emitters.remove(userId);
            }
        });
    }

    /**
     * Lấy số lượng emitters đang kết nối (để debug)
     */
    @GetMapping("/active-connections")
    public Map<String, Object> getActiveConnections() {
        return Map.of(
                "activeConnections", emitters.size(),
                "userIds", new ArrayList<>(emitters.keySet())
        );
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "OK",
                "timestamp", new Date().toString()
        );
    }
}

