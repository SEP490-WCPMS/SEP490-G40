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

    stompClient.onConnect = () => {
      // Subscribe kênh cá nhân
      stompClient.subscribe('/user/queue/notifications', (msg) => {
        try {
          const data = JSON.parse(msg.body);
          if (onMessage) onMessage(data);
        } catch {}
      });
      // Subscribe kênh nhóm (service-staff)
      stompClient.subscribe('/topic/service-staff', (msg) => {
        try {
          const data = JSON.parse(msg.body);
          if (onMessage) onMessage(data);
        } catch {}
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
