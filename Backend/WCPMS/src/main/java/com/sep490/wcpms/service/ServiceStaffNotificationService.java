package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Dịch vụ gửi thông báo real-time cho Service Staff qua SSE (Server-Sent Events)
 * Frontend lưu vào localStorage + nhận qua SSE
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ServiceStaffNotificationService {

    // Danh sách emitter hiện đang mở
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // Heartbeat scheduler để giữ cho kết nối không timeout (không cần @EnableScheduling toàn cục)
    private final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();

    // Khởi tạo heartbeat khi service được tạo
    {
        // Gửi ping mỗi 25s để tránh timeout default & giữ connection sống
        heartbeatScheduler.scheduleAtFixedRate(() -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("ping").data("keep-alive"));
                } catch (IOException e) {
                    // Nếu lỗi gửi -> loại emitter (client đã đóng)
                    emitters.remove(emitter);
                    log.debug("[SSE HEARTBEAT] Remove dead emitter: {}", e.getMessage());
                } catch (IllegalStateException ise) {
                    emitters.remove(emitter);
                }
            }
        }, 25, 25, TimeUnit.SECONDS);
    }

    /**
     * Subscribe - Frontend gọi để mở kết nối SSE
     */
    public SseEmitter subscribe() {
        // Dùng timeout rất lớn (Long.MAX_VALUE ~ "gần như vô hạn") tránh AsyncRequestTimeoutException
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        // Gửi sự kiện mở đầu để FE biết kết nối thành công (optional)
        try {
            emitter.send(SseEmitter.event().name("init").data("connected"));
        } catch (IOException e) {
            log.warn("[SSE] Failed initial send: {}", e.getMessage());
        }

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.info("[SSE] Client completed - emitters left: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            // Chỉ log và remove, không để Spring tự xử lý tiếp (giảm Unauthorized do filter đụng lại)
            emitters.remove(emitter);
            log.warn("[SSE] Client timeout removed - emitters left: {}", emitters.size());
            try { emitter.complete(); } catch (Exception ignored) {}
        });

        emitter.onError(e -> {
            emitters.remove(emitter);
            log.error("[SSE] Client error removed - reason: {} | emitters left: {}", e.getMessage(), emitters.size());
            try { emitter.completeWithError(e); } catch (Exception ignored) {}
        });

        // Cleanup emitter zombie trước khi thêm mới (loại những cái đã kết thúc nhưng chưa bị callback gọi)
        emitters.removeIf(this::isEmitterDead);
        emitters.add(emitter);
        log.info("[SSE] New subscription - total emitters: {}", emitters.size());

        return emitter;
    }

    /**
     * Đánh giá emitter còn sống (gửi ping thử nhẹ). Tránh leak danh sách.
     */
    private boolean isEmitterDead(SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event().name("probe").data("ok"));
            return false;
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Gửi thông báo đến tất cả Service Staff đang kết nối
     */
    public void broadcast(ServiceNotificationDTO notification) {
        log.info("[SSE BROADCAST] Type={}, ContractId={}, emitters={}",
                notification.getType(), notification.getContractId(), emitters.size());

        emitters.forEach(emitter -> {
            try {
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                        .id(String.valueOf(System.currentTimeMillis()))
                        .name("notification")
                        .data(notification)
                        .reconnectTime(5000); // FE tự reconnect nếu mạng gián đoạn

                emitter.send(event);
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
                log.debug("[SSE BROADCAST] Remove dead emitter (send fail): {}", e.getMessage());
            }
        });
    }

    /**
     * Lấy số lượng client đang kết nối
     */
    public int getConnectedClientsCount() {
        return emitters.size();
    }
}
