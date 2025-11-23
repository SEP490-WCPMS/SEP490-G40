package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.CustomerNotification;

/**
 * Service phụ trách GỬI EMAIL thực tế cho khách hàng
 * (sử dụng JavaMailSender, SMTP...).
 *
 * - Nhận vào 1 CustomerNotification đã được lưu (hoặc chuẩn bị lưu).
 * - Thực hiện gửi email + đính kèm file (nếu có).
 * - Cập nhật lại status SENT / FAILED trong DB.
 */
public interface CustomerNotificationEmailService {

    /**
     * Gửi email dựa trên thông tin trong CustomerNotification
     * (to, subject, content, attachment_url...).
     *
     * @param notification bản ghi thông báo cần gửi.
     */
    void sendEmail(CustomerNotification notification);
}

