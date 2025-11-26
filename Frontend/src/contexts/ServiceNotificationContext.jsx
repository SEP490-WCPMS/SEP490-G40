import React, { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../components/Services/apiClient';
import logger from '../lib/logger';
import useStaffNotificationSocket from '../hooks/useStaffNotificationSocket';
import { useAuth } from '../hooks/use-auth';
// Notification debug panel removed

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
        // Nhận notification realtime qua WebSocket và add vào context
        const { user } = useAuth();

        // Helper: extract actor id from notification payload (tries common field names)
        const extractActorId = (payload) => {
            if (!payload) return null;
            const keys = ['actorId','actorAccountId','createdBy','createdById','senderId','initiatorId','authorId','userId','accountId'];
            for (const k of keys) {
                if (payload[k] !== undefined && payload[k] !== null) return String(payload[k]);
            }
            // Some payloads might carry nested actor info
            if (payload.actor && payload.actor.id) return String(payload.actor.id);
            return null;
        };

        // Helper: robustly extract contract/reference id from various payload shapes
        const extractContractId = (payload) => {
            if (!payload) return null;
            const candidates = ['contractId','referenceId','contract_id','reference_id','id','contract?.id','payload?.contractId'];
            for (const k of candidates) {
                try {
                    // support nested path like 'contract.id' by splitting on '.'
                    if (k.includes('.')) {
                        const parts = k.split('.');
                        let cur = payload;
                        for (const p of parts) {
                            if (!cur) break;
                            cur = cur[p.replace('?','')];
                        }
                        if (cur !== undefined && cur !== null) return String(cur);
                    } else if (payload[k] !== undefined && payload[k] !== null) {
                        return String(payload[k]);
                    }
                } catch (e) {
                    continue;
                }
            }
            // fallback: sometimes payload carries nested 'data' or 'body'
            if (payload.data && payload.data.referenceId) return String(payload.data.referenceId);
            if (payload.body && payload.body.referenceId) return String(payload.body.referenceId);
            return null;
        };

        // (debug helpers removed)

        // Transient toasts (not persisted in list or unread count)
        const [transientToasts, setTransientToasts] = useState([]);
        const recentTransientIdsRef = React.useRef(new Set());
        const showTransientToast = useCallback((notification) => {
            const id = notification.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
            const toast = { ...notification, id, timestamp: notification.timestamp || new Date().toISOString() };

            // Dedupe transient toasts by id first, then by type+contractId within short window
            setTransientToasts(prev => {
                if (toast.id && recentTransientIdsRef.current.has(String(toast.id))) return prev;
                const isDup = prev.some(t =>
                    t.type === toast.type &&
                    t.contractId === toast.contractId &&
                    Math.abs(new Date(t.timestamp) - new Date(toast.timestamp)) < 5000
                );
                if (isDup) return prev;
                if (toast.id) recentTransientIdsRef.current.add(String(toast.id));
                return [toast, ...prev].slice(0, 5);
            });

            // Auto remove after 5s
            setTimeout(() => {
                setTransientToasts(prev => prev.filter(t => t.id !== id));
                if (id) recentTransientIdsRef.current.delete(String(id));
            }, 5000);
        }, []);

        useStaffNotificationSocket(
            (data) => {
                if (!data) return;

                const currentUserId = user?.id ? String(user.id) : null;

                // Normalize type: handle variants like 'signed', 'customer_signed', etc.
                try {
                    const rawType = (data.type || data.title || '').toString().toUpperCase();
                    if (rawType.includes('SIGN')) {
                        data.type = 'CUSTOMER_SIGNED_CONTRACT';
                    }
                } catch (e) {}

                const actor = extractActorId(data);

                // If backend sent actor info and this message originates from current user,
                // do NOT add it to bell/list. Show only a transient toast for immediate feedback.
                if (actor && currentUserId && String(actor) === currentUserId) {
                    try {
                        showTransientToast({
                            ...data,
                            id: data.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                            timestamp: data.timestamp || data.createdAt || new Date().toISOString()
                        });
                    } catch (e) {
                        // swallow
                    }
                    return;
                }

                // Lightweight debug log for incoming notifications
                try {
                    console.debug('[NOTIF WS] incoming payload:', data, 'extractedActor:', actor, 'currentUser:', currentUserId);
                } catch (e) {}

                // No client-side fallback: rely on backend actor info to suppress self-notify

                // Ensure a stable id exists so dedup works consistently
                if (!data.id) {
                    data.id = `notif_${data.type || 'unknown'}_${data.contractId || extractContractId(data) || 'nil'}_${Date.now()}`;
                }

                // If contractId missing in payload, attempt to extract
                if (!data.contractId) {
                    const extracted = extractContractId(data);
                    if (extracted) data.contractId = extracted;
                }

                // Normal flow: dedup + addNotification for recipients other than the actor
                setNotifications(prev => {
                    if (prev.some(n => n.id === data.id)) return prev;
                    setTimeout(() => addNotification(data), 0);
                    return prev;
                });
            },
            true // enabled
        );
    // Load từ localStorage nếu có
    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            logger.warn('[NOTIF] Failed to load from localStorage:', e);
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
            logger.warn('[NOTIF] Failed to calculate unreadCount:', e);
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
            logger.warn('[NOTIF LOCAL] Failed to save:', e);
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
            logger.error('[NOTIF DB SYNC] Failed to save:', error);
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
            apiClient.patch(`/service/notifications/${id}/read`)
                .catch(err => logger.warn('[NOTIF DB SYNC] Failed to mark as read in DB:', err))
                .finally(() => {
                    // Fetch unread count directly to avoid depending on function order
                    apiClient.get('/service/notifications/unread-count')
                        .then(resp => {
                            if (typeof resp?.data === 'number') setUnreadCount(resp.data);
                        })
                        .catch(() => {});
                });
        } catch (e) {
            logger.warn('[NOTIF DB SYNC] Error:', e);
            apiClient.get('/service/notifications/unread-count')
                .then(resp => { if (typeof resp?.data === 'number') setUnreadCount(resp.data); })
                .catch(() => {});
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
            logger.debug('[NOTIF DB SYNC] Marked all as read in DB');
        } catch (error) {
            logger.warn('[NOTIF DB SYNC] Failed to mark all as read:', error);
        } finally {
            // Ensure badge reflects server truth
            try {
                apiClient.get('/service/notifications/unread-count')
                    .then(resp => { if (typeof resp?.data === 'number') setUnreadCount(resp.data); })
                    .catch(() => {});
            } catch (e) {}
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
            logger.error('[NOTIF HISTORY] Failed:', error);
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

                const currentUserId = user?.id ? String(user.id) : null;
                const localIds = new Set(notifications.map(n => n.id));
                const newNotifications = dbNotifications.filter(n => {
                    const actor = n.actorId || n.actorAccountId || n.createdBy || n.createdById || n.initiatorId || n.senderId || n.userId || null;
                    return !(actor && currentUserId && String(actor) === currentUserId);
                }).filter(n => !localIds.has(n.id));

                if (newNotifications.length > 0) {
                    newNotifications.forEach(n => addNotification(n));
                }
            }
        } catch (error) {
            logger.error('[NOTIF REFRESH] Error:', error.message);
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
            logger.warn('[NOTIF DB SYNC] Failed to get unread count:', error);
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
                    const currentUserId = user?.id ? String(user.id) : null;
                    const dbNotifications = response.data.content
                        .filter(n => {
                            const actor = n.actorId || n.actorAccountId || n.createdBy || n.createdById || n.initiatorId || n.senderId || n.userId || null;
                            return !(actor && currentUserId && String(actor) === currentUserId);
                        })
                        .map(n => ({
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
                logger.warn('[NOTIF INIT] Failed to load history:', error);
            }
        };

        // Load on mount with small delay to ensure DB is ready
        const timer = setTimeout(loadInitialHistory, 500);
        return () => clearTimeout(timer);
    }, []);

    // Cleaned up: Removed SSE and polling fallback logic. Only DB/history logic remains. Implement WebSocket logic here later.

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
        refreshNotifications,          // ✅ 🔧 NEW: Manual refresh (WORKAROUND)
        // Transient toasts for self-actions (not persisted to list or unread count)
        transientToasts,
        showTransientToast,
        // Debug helpers removed
    };

    return (
        <ServiceNotificationContext.Provider value={value}>
            {children}
        </ServiceNotificationContext.Provider>
    );
};
