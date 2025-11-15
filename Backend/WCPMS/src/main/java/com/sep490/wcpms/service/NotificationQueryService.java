package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.NotificationDTO;
import org.springframework.data.domain.Page;

/**
 * Service interface để truy vấn lịch sử thông báo của người dùng hiện tại (theo token).
 * - getMyNotifications: trả về danh sách thông báo (phân trang)
 * - getMyUnreadCount: đếm số thông báo chưa đọc
 * - markRead / markAllRead: đánh dấu đã đọc
 */
public interface NotificationQueryService {
    Page<NotificationDTO> getMyNotifications(int page, int size);
    long getMyUnreadCount();
    void markRead(Long id);
    void markAllRead();
}

