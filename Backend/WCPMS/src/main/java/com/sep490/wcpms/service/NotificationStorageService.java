package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import com.sep490.wcpms.entity.StaffNotification;

/**
 * Interface for persisting notifications to the database (history) for any receiver role.
 * Implementations save notification records for recipients.
 */
public interface NotificationStorageService {
    StaffNotification saveForReceiver(Integer receiverAccountId, ServiceNotificationDTO dto);
}
