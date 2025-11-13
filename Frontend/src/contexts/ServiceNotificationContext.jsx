import React, { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../components/Services/apiClient';

/**
 * 🔔 SERVICE STAFF ONLY - Notification Context (Hybrid: localStorage + DB)
 * 
 * Architecture:
 * - localStorage: Recent 100 notifications - Fast access, offline ready
 * - Backend DB: Full history - Persistent, query-able
 * 
 * Sync Strategy:
 * 1. New SSE notification → localStorage (instant) + API save (async)
 * 2. On mount → Load from localStorage (fast) + Sync DB in background
 * 3. localStorage full → Keep 100 most recent
 * 4. Periodic sync → Every 30s check unread count from DB
 */
export const ServiceNotificationContext = createContext();

const STORAGE_KEY = 'serviceNotifications';
const SYNC_DEBOUNCE_MS = 1000; // Debounce DB saves

export const ServiceNotificationProvider = ({ children }) => {
    // Load từ localStorage nếu có
    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('[NOTIF] Failed to load from localStorage:', e);
            return [];
        }
    });

    const [unreadCount, setUnreadCount] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const notifs = JSON.parse(stored);
                return notifs.filter(n => !n.isRead).length;
            }
        } catch (e) {
            console.warn('[NOTIF] Failed to calculate unreadCount:', e);
        }
        return 0;
    });

    // Track pending DB saves
    const [pendingSaves, setPendingSaves] = useState(new Set());
    const [syncTimer, setSyncTimer] = useState(null);

    // Auto-save notifications to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        } catch (e) {
            console.warn('[NOTIF LOCAL] Failed to save:', e);
        }
    }, [notifications]);


    // ✅ Sync notification to DB (async, non-blocking)
    const syncNotificationToDB = useCallback(async (notification) => {
        // Skip if already pending
        if (pendingSaves.has(notification.id)) return;

        try {
            setPendingSaves(prev => new Set(prev).add(notification.id));

            await apiClient.post('/service/notifications/save', {
                type: notification.type,
                message: notification.message,
                contractId: notification.contractId,
                timestamp: notification.timestamp
            });

            setPendingSaves(prev => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        } catch (error) {
            console.error('[NOTIF DB SYNC] Failed to save:', error);
            setPendingSaves(prev => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    }, [pendingSaves]);

    // Ẩn popup nhưng giữ notification trong dropdown
    const hidePopup = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isVisible: false } : n)
        );
    }, []);

    // Xóa hoàn toàn notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => {
            const exists = prev.some(n => n.id === id && !n.isRead);
            if (exists) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    // ✅ HYBRID: Add notification (preserve server id; only DB-save for local)
    const addNotification = useCallback((notification) => {
        // If server already provides id, keep it so mark-as-read etc. works
        const providedId = notification?.id;
        const isServerId = providedId && !String(providedId).startsWith('notif_');
        const id = isServerId ? providedId : `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Prefer provided timestamp; fallback to now
        const timestamp = notification?.timestamp || notification?.createdAt || new Date().toISOString();

        const newNotif = {
            ...notification,
            id,
            isRead: notification?.isRead ?? false,
            isVisible: true,
            timestamp,
            // Skip FE DB save for SSE-originated notifications; backend decides persistence
            syncedToDb: notification?.source === 'sse' ? true : (isServerId ? true : false),
            source: notification?.source || (isServerId ? 'server' : 'local')
        };

        // ✅ Step 1: Save to local state/localStorage immediately with de-dup logic
        setNotifications(prev => {
            // ✅ DEDUP: Skip if same notification already exists (regardless of source)
            // Match by: same type + same contractId + timestamp within 5 seconds
            const isDuplicate = prev.some(n => 
                n.type === newNotif.type && 
                n.contractId === newNotif.contractId &&
                Math.abs(new Date(n.timestamp) - new Date(newNotif.timestamp)) < 5000
            );
            
            if (isDuplicate) {
                return prev;
            }

            // Replace older SSE placeholder if DB item arrives (for persistence)
            let filtered = prev.filter(n => n.id !== id);
            if (newNotif.source === 'db') {
                filtered = filtered.filter(n => !(n.source === 'sse' && n.type === newNotif.type && n.contractId === newNotif.contractId));
            }

            const updated = [newNotif, ...filtered].slice(0, 100);
            return updated;
        });
        if (!newNotif.isRead) setUnreadCount(prev => prev + 1);

        // ✅ Step 2: Async save to DB only for local-created notifications
        if (!newNotif.syncedToDb) {
            if (syncTimer) clearTimeout(syncTimer);
            const timer = setTimeout(() => {
                syncNotificationToDB(newNotif);
            }, SYNC_DEBOUNCE_MS);
            setSyncTimer(timer);
        }

        // Auto-ẩn popup sau 5 giây (nhưng giữ lại trong dropdown)
        setTimeout(() => {
            hidePopup(id);
        }, 5000);
    }, [hidePopup, syncNotificationToDB, syncTimer]);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // ✅ Also sync to DB if this is a server-side id
        const isServerId = id && !String(id).startsWith('notif_');
        if (!isServerId) return; // local-only notification

        try {
            apiClient.patch(`/service/notifications/${id}/read`).catch(err => 
                console.warn('[NOTIF DB SYNC] Failed to mark as read in DB:', err)
            );
        } catch (e) {
            console.warn('[NOTIF DB SYNC] Error:', e);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);

        // ✅ Sync to DB
        try {
            await apiClient.patch('/service/notifications/mark-all-read');
            console.log('[NOTIF DB SYNC] Marked all as read in DB');
        } catch (error) {
            console.warn('[NOTIF DB SYNC] Failed to mark all as read:', error);
        }
    }, []);

    // ✅ Load full history from DB (pagination)
    const loadNotificationHistory = useCallback(async (page = 0, size = 20) => {
        try {
            const response = await apiClient.get('/service/notifications', {
                params: { page, size }
            });
            return response.data;
        } catch (error) {
            console.error('[NOTIF HISTORY] Failed:', error);
            throw error;
        }
    }, []);

    // ✅ MANUAL REFRESH - Force refresh notifications from DB
    // Used when survey is submitted or notification should appear
    const refreshNotifications = useCallback(async () => {
        try {
            const response = await apiClient.get('/service/notifications', {
                params: { page: 0, size: 30, sort: 'createdAt,desc' }
            });
            
            if (response.data?.content && response.data.content.length > 0) {
                const dbNotifications = response.data.content.map(n => ({
                    id: n.id,
                    type: n.title || n.type,
                    message: n.message,
                    contractId: n.referenceId,
                    isRead: n.read,
                    timestamp: n.createdAt,
                    isVisible: true,
                    source: 'db'
                }));

                const localIds = new Set(notifications.map(n => n.id));
                const newNotifications = dbNotifications.filter(n => !localIds.has(n.id));

                if (newNotifications.length > 0) {
                    newNotifications.forEach(n => addNotification(n));
                }
            }
        } catch (error) {
            console.error('[NOTIF REFRESH] Error:', error.message);
        }
    }, [notifications, addNotification]);


    // ✅ Sync unread count from DB (periodic)
    const syncUnreadCountFromDB = useCallback(async () => {
        try {
            const response = await apiClient.get('/service/notifications/unread-count');
            const dbUnreadCount = response.data;
            
            // Update whenever different to reflect backend truth
            if (unreadCount !== dbUnreadCount) {
                setUnreadCount(dbUnreadCount);
            }
        } catch (error) {
            console.warn('[NOTIF DB SYNC] Failed to get unread count:', error);
        }
    }, [unreadCount]);

    // ✅ Load history from DB on mount
    useEffect(() => {
        const loadInitialHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            try {
                const response = await apiClient.get('/service/notifications', {
                    params: { page: 0, size: 100, sort: 'createdAt,desc' }
                });
                
                if (response.data?.content) {
                    const dbNotifications = response.data.content.map(n => ({
                        id: n.id,
                        // Backend NotificationDTO uses `title` for event type, `type` for domain category
                        type: n.title || n.type,
                        message: n.message,
                        contractId: n.referenceId,
                        isRead: n.read,
                        timestamp: n.createdAt,
                        isVisible: false,
                        source: 'db'
                    }));
                    
                    // Merge: DB history + localStorage recent (localStorage priority for duplicates)
                    const localIds = new Set(notifications.map(n => n.id));
                    const merged = [
                        ...notifications,
                        ...dbNotifications.filter(n => !localIds.has(n.id))
                    ].slice(0, 100);
                    
                    setNotifications(merged);
                    // Align unread count with merged data
                    const mergedUnread = merged.filter(n => !n.isRead).length;
                    setUnreadCount(mergedUnread);
                }
            } catch (error) {
                console.warn('[NOTIF INIT] Failed to load history:', error);
            }
        };

        // Load on mount with small delay to ensure DB is ready
        const timer = setTimeout(loadInitialHistory, 500);
        return () => clearTimeout(timer);
    }, []);

    // ✅ Periodic background sync (every 30s)
    // + Fallback polling if SSE fails: fetch new notifications every 10s
    useEffect(() => {
        const syncInterval = setInterval(() => {
            const token = localStorage.getItem('token');
            if (token) {
                syncUnreadCountFromDB();
            }
        }, 30000);

        // Fallback polling: Check for new notifications every 10s (when SSE fails)
        // 🔧 OPTIMIZATION: Only poll if SSE is NOT working
        const pollingInterval = setInterval(async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            // ✅ OPTIMIZATION: Check if SSE is active
            const sseLastEvent = localStorage.getItem('sseLastEventAt');
            if (sseLastEvent) {
                const sseAgeSec = (Date.now() - new Date(sseLastEvent).getTime()) / 1000;
                // If SSE event received within last 30 seconds, skip polling (SSE is working)
                if (sseAgeSec < 30) {
                    return;
                }
            }

            try {
                const response = await apiClient.get('/service/notifications', {
                    params: { page: 0, size: 20, sort: 'createdAt,desc' }
                });
                if (response.data?.content && response.data.content.length > 0) {
                    // Get latest 10 from DB
                    const dbNotifications = response.data.content.map(n => ({
                        id: n.id,
                        type: n.title || n.type,
                        message: n.message,
                        contractId: n.referenceId,
                        isRead: n.read,
                        timestamp: n.createdAt,
                        isVisible: true,
                        source: 'db'
                    }));

                    // Find new notifications (not in current list)
                    const localIds = new Set(notifications.map(n => n.id));
                    const newNotifications = dbNotifications.filter(n => !localIds.has(n.id));

                    if (newNotifications.length > 0) {
                        newNotifications.forEach(n => addNotification(n));
                    }
                }
            } catch (error) {
                // ⚠️ Bỏ qua lỗi polling im lặng (backend có thể chưa allow)
                // SSE hoạt động → polling là fallback thôi
                if (error.response?.status !== 401 && error.message === 'canceled') {
                    // Silent fail for fallback polling
                }
            }
        }, 10000); // Poll every 10 seconds (only when SSE fails)

        return () => {
            clearInterval(syncInterval);
            clearInterval(pollingInterval);
        };
    }, [syncUnreadCountFromDB, addNotification, notifications]);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        hidePopup,
        markAsRead,
        markAllAsRead,
        clearAll,
        loadNotificationHistory,      // ✅ Load full history from DB
        syncUnreadCountFromDB,         // ✅ Manual sync from DB
        refreshNotifications           // ✅ 🔧 NEW: Manual refresh (WORKAROUND)
    };

    return (
        <ServiceNotificationContext.Provider value={value}>
            {children}
        </ServiceNotificationContext.Provider>
    );
};
