package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Deprecated placeholder: real-time push removed. This service is kept as a no-op to avoid breaking
 * existing injections; use polling or websocket implementations outside this class.
 */
@Service
@Slf4j
@Deprecated
public class ServiceStaffNotificationService {

    public ServiceStaffNotificationService() {
        log.info("ServiceStaffNotificationService is deprecated and running as no-op.");
    }

    /**
     * No-op subscribe replacement.
     */
    public Object subscribe() {
        log.warn("subscribe() called on deprecated ServiceStaffNotificationService.");
        return null;
    }

    /**
     * Broadcast is a no-op here; persistence is handled elsewhere.
     */
    public void broadcast(ServiceNotificationDTO notification) {
        log.debug("broadcast() called on deprecated ServiceStaffNotificationService; type={}", notification != null ? notification.getType() : null);
    }

    public int getConnectedClientsCount() {
        return 0;
    }
}
