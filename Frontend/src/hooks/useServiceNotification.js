import { useEffect, useRef, useCallback } from 'react';
import apiClient from '../components/Services/apiClient';

export const useServiceNotification = (onNotification, enabled = true) => {
    const eventSourceRef = useRef(null);
    const abortControllerRef = useRef(null); // for fetch-based SSE with headers
    const pollingIntervalRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);
    const methodRef = useRef('idle');
    const connectingRef = useRef(false); // prevent parallel connection attempts
    const onNotificationRef = useRef(onNotification); // stable ref to avoid re-connect loops

    // keep ref updated without changing connect effect deps
    useEffect(() => { onNotificationRef.current = onNotification; }, [onNotification]);

    // Parse SSE chunks from text and dispatch 'notification' events
    const processSSEBuffer = useCallback((bufferText) => {
        const events = bufferText.split(/\n\n|\r\n\r\n/);
        for (const raw of events) {
            if (!raw || raw.trim() === '') continue;
            console.log('[SERVICE SSE] RAW event chunk:', raw); // 🔍 DIAGNOSTIC
            const lines = raw.split(/\r?\n/);
            let eventName = 'message';
            let dataLines = [];
            for (const line of lines) {
                if (line.startsWith('event:')) {
                    eventName = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                    dataLines.push(line.slice(5).trim());
                }
            }
            const dataStr = dataLines.join('\n');
            console.log('[SERVICE SSE] EVENT TYPE:', eventName, 'DATA:', dataStr); // 🔍 DIAGNOSTIC
            if (eventName === 'notification' && dataStr) {
                try {
                    const notification = JSON.parse(dataStr);
                    if (notification.type !== 'INIT') {
                        console.log('[SERVICE SSE] Received:', notification);
                        try { localStorage.setItem('sseLastEventAt', new Date().toISOString()); } catch {}
                        if (onNotificationRef.current) onNotificationRef.current(notification);
                    }
                } catch (err) {
                    console.error('[SERVICE SSE] Parse error:', err, 'for dataStr:', dataStr);
                }
            }
        }
    }, []);

    // SSE via fetch to send Authorization header
    const connectSSEWithHeader = useCallback(async () => {
        if (!enabled) return false;
        if (connectingRef.current) {
            return false;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('[SERVICE SSE] No token found');
            return false;
        }
        try {
            console.log('[SERVICE SSE] Connecting (header mode)');
            connectingRef.current = true;
            abortControllerRef.current = new AbortController();
            // Use Vite dev proxy via relative path to avoid CORS in dev
            const res = await fetch('/api/service/notifications/stream', {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Authorization': `Bearer ${token}`
                },
                signal: abortControllerRef.current.signal,
                // Do NOT send cookies; we use Bearer token
                credentials: 'omit'
            });

            if (!res.ok) {
                console.warn('[SERVICE SSE] Header mode failed with status', res.status);
                abortControllerRef.current = null;
                connectingRef.current = false;
                return false;
            }

            methodRef.current = 'sse';
            retryCountRef.current = 0;
            console.log('[SERVICE SSE] Connected (header mode)');
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                // Process complete events if delimiter present
                const parts = buffer.split(/\n\n|\r\n\r\n/);
                // Keep last partial in buffer
                buffer = parts.pop() || '';
                processSSEBuffer(parts.join('\n\n'));
            }

            console.warn('[SERVICE SSE] Stream ended');
            abortControllerRef.current = null;
            connectingRef.current = false;
            return false; // indicate not connected anymore
        } catch (error) {
            console.error('[SERVICE SSE] Header mode error:', error);
            abortControllerRef.current = null;
            connectingRef.current = false;
            return false;
        }
    }, [enabled, processSSEBuffer]);

    const connectSSE = useCallback(() => {
        if (!enabled) return;
        if (connectingRef.current) {
            console.log('[SERVICE SSE] Skipping connect attempt - already connecting');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('[SERVICE SSE] No token found');
            return;
        }
        try {
            console.log('[SERVICE SSE] Connecting (EventSource-first)');
            // Try EventSource with token in query first to avoid CORS preflight in many dev setups.
            const encodedToken = encodeURIComponent(token);
            const streamUrl = `/api/service/notifications/stream-token?token=${encodedToken}`;
            console.log('[SERVICE SSE] Full URL:', streamUrl);
            console.log('[SERVICE SSE] Token length:', token.length);
            let opened = false;

            // Clean up any existing EventSource
            if (eventSourceRef.current) {
                try { eventSourceRef.current.close(); } catch {}
                eventSourceRef.current = null;
            }

            eventSourceRef.current = new EventSource(streamUrl);
            methodRef.current = 'sse';
            retryCountRef.current = 0;
            connectingRef.current = true;

            const openTimeout = setTimeout(() => {
                if (!opened) {
                    console.warn('[SERVICE SSE] EventSource did not open in time; starting polling');
                    try { eventSourceRef.current.close(); } catch {}
                    eventSourceRef.current = null;
                    connectingRef.current = false;
                    methodRef.current = 'polling';
                    startPolling();
                }
            }, 15000);  // Tăng timeout từ 6s lên 15s để EventSource kịp handshake

            eventSourceRef.current.addEventListener('open', () => {
                opened = true;
                connectingRef.current = false;
                clearTimeout(openTimeout);
                console.log('[SERVICE SSE] Connected (EventSource)');
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            });

            // BE sends an init event when connected
            eventSourceRef.current.addEventListener('init', () => {
                try { localStorage.setItem('sseLastEventAt', new Date().toISOString()); } catch {}
                console.log('[SERVICE SSE] Init received');
            });

            // Optional keep-alive pings
            eventSourceRef.current.addEventListener('ping', () => {
                // no-op, just to keep timeline fresh
            });

            eventSourceRef.current.addEventListener('notification', (event) => {
                try {
                    console.log('[SERVICE SSE] RAW event.data:', event.data); // 🔍 DIAGNOSTIC: log raw data before parsing
                    const notification = JSON.parse(event.data);
                    console.log('[SERVICE SSE] PARSED notification:', JSON.stringify(notification)); // 🔍 DIAGNOSTIC: log parsed object
                    if (notification.type === 'INIT') return;
                    console.log('[SERVICE SSE] Received:', notification);
                    try { localStorage.setItem('sseLastEventAt', new Date().toISOString()); } catch {}
                    if (onNotificationRef.current) {
                        console.log('[SERVICE SSE] Calling onNotificationRef.current with:', notification); // 🔍 Confirm callback invoked
                        onNotificationRef.current(notification);
                    } else {
                        console.warn('[SERVICE SSE] onNotificationRef.current is NOT set!'); // 🔍 Critical: callback missing
                    }
                } catch (err) {
                    console.error('[SERVICE SSE] Parse error:', err, 'for data:', event.data); // 🔍 DIAGNOSTIC: include raw data in error
                }
            });

            // Fallback generic message handler in case server doesn't label the event
            eventSourceRef.current.addEventListener('message', (event) => {
                try {
                    if (!event?.data) return;
                    console.log('[SERVICE SSE][message] RAW fallback data:', event.data); // 🔍 DIAGNOSTIC
                    const data = JSON.parse(event.data);
                    // Some servers send untyped messages; normalize to notification shape if possible
                    if (data && (data.type || data.title || data.message)) {
                        const normalized = {
                            id: data.id,
                            type: data.type || data.title,
                            message: data.message,
                            contractId: data.referenceId || data.contractId,
                            timestamp: data.createdAt || data.timestamp
                        };
                        console.log('[SERVICE SSE][message] Fallback received:', normalized);
                        try { localStorage.setItem('sseLastEventAt', new Date().toISOString()); } catch {}
                        if (onNotificationRef.current) {
                            console.log('[SERVICE SSE][message] Calling onNotificationRef.current'); // 🔍 Confirm callback
                            onNotificationRef.current(normalized);
                        }
                    } else {
                        console.debug('[SERVICE SSE][message] Ignored unrecognized payload:', data);
                    }
                } catch (err) {
                    console.debug('[SERVICE SSE][message] Non-JSON payload:', err);
                }
            });

            eventSourceRef.current.addEventListener('error', (event) => {
                console.error('[SERVICE SSE] EventSource error:', {
                    readyState: eventSourceRef.current?.readyState,
                    readyStateReadyState: EventSource.CLOSED,
                    event: event
                });
                console.error('[SERVICE SSE] EventSource readyState codes - CONNECTING:', EventSource.CONNECTING, 'OPEN:', EventSource.OPEN, 'CLOSED:', EventSource.CLOSED);
                // If EventSource is closed, start polling
                if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CLOSED) {
                    console.warn('[SERVICE SSE] EventSource closed; starting polling');
                    clearTimeout(openTimeout);
                    opened = true; // Prevent double-starting polling
                    try { eventSourceRef.current.close(); } catch {}
                    eventSourceRef.current = null;
                    connectingRef.current = false;
                    methodRef.current = 'polling';
                    startPolling();
                }
            });
        } catch (error) {
            console.error('[SERVICE SSE] Setup error:', error);
            connectingRef.current = false;
            scheduleSSEReconnect();
        }
    }, [enabled, connectSSEWithHeader]);

    const pollNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            // Log minimal identity info to correlate with backend filters (no token printed)
            let userInfo = null;
            try { userInfo = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
            console.log('[POLLING] Fetching', { userId: userInfo?.id, role: userInfo?.roleName });
            const [historyRes, unreadRes] = await Promise.all([
                apiClient.get('/service/notifications', { params: { page: 0, size: 20, sort: 'createdAt,desc' } }),
                apiClient.get('/service/notifications/unread-count')
            ]);

            const historyData = historyRes.data || {};
            const content = historyData.content || [];
            console.log('[POLLING] Got', content.length, 'notifications', 'Unread:', unreadRes.data);

            const stored = JSON.parse(localStorage.getItem('serviceNotifications') || '[]');
            const newItems = content.filter(c => !stored.some(s => s.id === c.id));

            if (newItems.length > 0) {
                console.log('[POLLING] Found', newItems.length, 'new items, calling onNotification'); // 🔍 DEBUG
                newItems.forEach(item => {
                    const notification = {
                        id: item.id,
                        // REST may return event type in title
                        type: item.title || item.type,
                        message: item.message,
                        contractId: item.referenceId,
                        isRead: item.read,
                        timestamp: item.createdAt
                    };
                    console.log('[POLLING] Processing item:', notification); // 🔍 DEBUG
                    if (onNotification) {
                        console.log('[POLLING] Calling onNotification'); // 🔍 DEBUG callback invoked
                        onNotification(notification);
                    } else {
                        console.warn('[POLLING] onNotification is NOT set!'); // 🔍 Critical
                    }
                });
            } else {
                console.log('[POLLING] No new items'); // 🔍 DEBUG
            }
        } catch (error) {
            const status = error?.response?.status;
            console.error('[POLLING] Error:', status || error.message);
            if (status === 401) {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                console.warn('[POLLING] 401 - stopped polling');
            }
        }
    }, [onNotification]);

    const startPolling = useCallback(() => {
        if (pollingIntervalRef.current) return;
        console.log('[POLLING] Starting');
        methodRef.current = 'polling';
        pollNotifications();
        pollingIntervalRef.current = setInterval(pollNotifications, 10000);
    }, [pollNotifications]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const scheduleSSEReconnect = useCallback(() => {
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 60000);
        retryCountRef.current++;
        console.log(`[SSE] Reconnecting in ${delay / 1000}s`);
        retryTimeoutRef.current = setTimeout(() => connectSSE(), delay);
    }, [connectSSE]);

    useEffect(() => {
        // Only initiate (or re-initiate) when enabled changes from false->true
        console.log('[SERVICE SSE EFFECT] enabled:', enabled, 'connectSSE defined:', !!connectSSE); // 🔍 DEBUG
        if (enabled) {
            console.log('[SERVICE SSE EFFECT] Calling connectSSE()'); // 🔍 DEBUG
            connectSSE();
        } else {
            console.log('[SERVICE SSE EFFECT] disabled, cleaning up'); // 🔍 DEBUG
            // if disabled, ensure cleanup
            if (eventSourceRef.current) { try { eventSourceRef.current.close(); } catch {}; eventSourceRef.current = null; }
            if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
            stopPolling();
            methodRef.current = 'idle';
        }
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (eventSourceRef.current) eventSourceRef.current.close();
            if (abortControllerRef.current) abortControllerRef.current.abort();
            stopPolling();
            connectingRef.current = false;
        };
    }, [enabled, connectSSE, stopPolling]);

    return {
        isConnected: methodRef.current === 'sse' && (eventSourceRef.current?.readyState === EventSource.OPEN || abortControllerRef.current != null),
        isPolling: pollingIntervalRef.current !== null,
        method: methodRef.current,
        disconnect: () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            stopPolling();
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            methodRef.current = 'idle';
            connectingRef.current = false;
        }
    };
};
