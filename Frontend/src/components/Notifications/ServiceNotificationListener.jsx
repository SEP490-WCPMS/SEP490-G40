import React, { useContext, useEffect } from 'react';
import { useServiceNotification } from '../../hooks/useServiceNotification';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';

/**
 * 🔔 SERVICE STAFF ONLY - Notification Listener
 * Wrapper component:
 * - Sử dụng hook SSE (Fetch API + Authorization header)
 * - Đẩy thông báo vào Context
 * - Component này không render UI, chỉ quản lý logic
 * - Chỉ hoạt động cho SERVICE_STAFF role
 */
export const ServiceNotificationListener = () => {
    const { addNotification } = useContext(ServiceNotificationContext);
    
    // Check xem user có phải SERVICE_STAFF không
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Field name là 'roleName' hoặc 'role' (tùy response format)
    const userRole = user.roleName || user.role;
    const isServiceStaff = userRole === 'SERVICE_STAFF';
    
    // Debug log
    console.log('[🔔 SERVICE DEBUG] User:', user);
    console.log('[🔔 SERVICE DEBUG] Role:', userRole);
    console.log('[🔔 SERVICE DEBUG] Is SERVICE_STAFF?', isServiceStaff);
    
    // ✅ SSE chỉ enable cho SERVICE_STAFF
    const { isConnected } = useServiceNotification((notification) => {
        const enriched = { ...notification, source: 'sse' };
        console.log('[🔔 SERVICE] Adding notification:', enriched);
        addNotification(enriched);
    }, isServiceStaff); // Enable chỉ khi là SERVICE_STAFF

    useEffect(() => {
        if (isConnected) {
            console.log('[🔔 SERVICE] Listener connected');
        }
    }, [isConnected]);

    // Watchdog: nếu 5 phút không nhận SSE event, log cảnh báo để debug backend
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const ts = localStorage.getItem('sseLastEventAt');
                if (!ts) return;
                const diffMin = (Date.now() - new Date(ts).getTime()) / 60000;
                if (diffMin > 5) {
                    console.warn('[🔔 SERVICE] No SSE events for', diffMin.toFixed(1), 'minutes');
                }
            } catch {}
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Không log nếu không phải SERVICE_STAFF
    if (!isServiceStaff) {
        console.debug('[🔔 SERVICE] SSE disabled - user is not SERVICE_STAFF, role is:', userRole);
        return null;
    }

    return null; // Không render gì
};
