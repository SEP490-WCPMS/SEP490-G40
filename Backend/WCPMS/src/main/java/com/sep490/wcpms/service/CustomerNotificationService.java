package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CustomerNotificationDTO;

import java.util.List;

public interface CustomerNotificationService {

    /**
     * Lấy tất cả thông báo dành cho 1 account khách hàng
     * (account có thể có nhiều Customer).
     */
    List<CustomerNotificationDTO> getNotificationsForAccount(Integer accountId);

    /**
     * Lấy tất cả thông báo theo 1 customer cụ thể.
     */
    List<CustomerNotificationDTO> getNotificationsForCustomer(Integer customerId);

    /**
     * Lấy chi tiết 1 thông báo theo id (dùng cho xem chi tiết).
     */
    CustomerNotificationDTO getNotificationById(Integer id);
}
