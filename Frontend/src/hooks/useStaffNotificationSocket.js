import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * useStaffNotificationSocket
 * Kết nối WebSocket (STOMP + SockJS) tới backend để nhận thông báo staff realtime.
 * @param {function} onMessage - callback khi nhận được notification mới
 * @param {boolean} enabled - bật/tắt kết nối
 */
export default function useStaffNotificationSocket(onMessage, enabled = true) {
  const clientRef = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Sử dụng native WebSocket + STOMP (backend yêu cầu CONNECT header Authorization)
    const brokerUrl = 'ws://localhost:8080/ws-notifications'; // đổi host/port nếu cần
    const stompClient = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      debug: () => {}, // tắt debug logs
      // onConnect sẽ được gán phía dưới để có thể dùng stompClient.subscribe()
    });

    // Gắn header CONNECT trước khi activate
    stompClient.connectHeaders = {
      Authorization: `Bearer ${token}`
    };

    // Determine topics to subscribe to based on user/token
    const normalizeRoleToTopic = (r) => {
      if (!r) return null;
      return String(r).toLowerCase().replace(/^role_/, '').replace(/[^a-z0-9]+/g, '-');
    };

    const topics = new Set();
    // keep legacy service-staff topic for compatibility
    topics.add('service-staff');

    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.roleName) {
          const t = normalizeRoleToTopic(user.roleName);
          if (t) topics.add(t);
        }
      }
    } catch (e) {}

    try {
      // also inspect JWT roles claim if present
      const parts = token.split('.');
      if (parts.length > 1) {
        const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = JSON.parse(decodeURIComponent(atob(payloadB64).split('').map(function(c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join('')));
        const roles = json?.roles || json?.role || null;
        if (Array.isArray(roles)) {
          roles.forEach(r => { const t = normalizeRoleToTopic(r); if (t) topics.add(t); });
        } else if (typeof roles === 'string') {
          const t = normalizeRoleToTopic(roles); if (t) topics.add(t);
        }
      }
    } catch (e) {}

    stompClient.onConnect = () => {
      // Subscribe personal queue
      stompClient.subscribe('/user/queue/notifications', (msg) => {
        try {
          const data = JSON.parse(msg.body);
          if (onMessage) onMessage(data);
        } catch (err) { console.error('WS parse error', err); }
      });

      // Subscribe to determined topics
      topics.forEach(topic => {
        try {
          stompClient.subscribe(`/topic/${topic}`, (msg) => {
            try {
              const data = JSON.parse(msg.body);
              if (onMessage) onMessage(data);
            } catch (err) { console.error('WS parse error', err); }
          });
        } catch (e) {}
      });
    };

    stompClient.onStompError = (frame) => {
      // Có thể log lỗi nếu cần
    };

    stompClient.onWebSocketClose = () => {
      // Tự reconnect sau 3s nếu mất kết nối
      reconnectTimeout.current = setTimeout(() => {
        stompClient.activate();
      }, 3000);
    };
    clientRef.current = stompClient;
    stompClient.activate();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, [enabled, onMessage]);
}
