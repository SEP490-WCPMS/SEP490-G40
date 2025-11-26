package com.sep490.wcpms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToUser(String username, Object payload) {
        try {
            messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
            log.info("[WS] Sent to user {}: {}", username, payload);
        } catch (Exception e) {
            log.error("[WS] Failed to send to user {}: {}", username, e.getMessage(), e);
        }
    }

    public void sendToTopic(String topic, Object payload) {
        try {
            String destination = "/topic/" + topic;
            messagingTemplate.convertAndSend(destination, payload);
            log.info("[WS] Broadcast to {}: {}", destination, payload);
        } catch (Exception e) {
            log.error("[WS] Failed to broadcast to topic {}: {}", topic, e.getMessage(), e);
        }
    }
}

