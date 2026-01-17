package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.InternalNotification;
import com.sep490.wcpms.repository.InternalNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternalNotificationService {
    private final InternalNotificationRepository repo;

    // Dùng Propagation.REQUIRES_NEW để việc lưu thông báo là một transaction riêng biệt.
    // Nếu lưu thông báo lỗi, nó KHÔNG làm rollback logic chính (ví dụ: duyệt hợp đồng).
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(Integer recipientId, String roleName, String title, String message, Integer refId, InternalNotification.NotificationType type) {
        try {
            log.info("CREATING NOTIFICATION: ToUser={}, ToRole='{}', Title='{}'", recipientId, roleName, title);
            InternalNotification noti = InternalNotification.builder()
                    .recipientId(recipientId)
                    .recipientRole(roleName)
                    .title(title)
                    .message(message)
                    .referenceId(refId)
                    .referenceType(type)
                    .isRead(false)
                    .build();
            InternalNotification saved = repo.save(noti);
            log.info("NOTIFICATION SAVED: ID={}", saved.getId());
        } catch (Exception e) {
            // Chỉ log lỗi, không ném exception ra ngoài để tránh ảnh hưởng luồng chính
            log.error("Failed to create internal notification: {}", e.getMessage());
            e.printStackTrace();
        }
    }
}