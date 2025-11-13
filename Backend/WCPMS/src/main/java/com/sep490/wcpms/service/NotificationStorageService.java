package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import com.sep490.wcpms.entity.Notification;

/**
 * Lưu trữ thông báo xuống DB (lịch sử) theo mô hình Hybrid (SSE + DB).
 * Dùng chung cho nhiều role: truyền receiverAccountId tương ứng.
 */
public interface NotificationStorageService {
    Notification saveForReceiver(Integer receiverAccountId, ServiceNotificationDTO dto);
}
