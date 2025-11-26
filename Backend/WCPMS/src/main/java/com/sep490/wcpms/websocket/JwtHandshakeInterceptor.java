package com.sep490.wcpms.websocket;

import com.sep490.wcpms.security.jwt.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

/**
 * Handshake interceptor to extract JWT token from query param or headers during WebSocket handshake
 * and validate it, then set username as principal name in attributes for later use.
 */
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private static final Logger log = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public boolean beforeHandshake(org.springframework.http.server.ServerHttpRequest request,
                                   org.springframework.http.server.ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        try {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpServletRequest httpServletRequest = servletRequest.getServletRequest();

                // Try Authorization header first
                String authHeader = httpServletRequest.getHeader("Authorization");
                String token = null;
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                }

                // fallback to query param ?token=
                if (token == null) {
                    token = httpServletRequest.getParameter("token");
                }

                if (token == null) {
                    // Use DEBUG to avoid noisy logs in normal flows (some clients may connect anonymously)
                    log.debug("[WS HANDSHAKE] No token provided for websocket handshake");
                    return true; // allow handshake but user won't have principal
                }

                if (!jwtUtils.validateJwtToken(token)) {
                    log.warn("[WS HANDSHAKE] Invalid token during websocket handshake");
                    return false;
                }

                String username = jwtUtils.getUserNameFromJwtToken(token);
                Integer userId = jwtUtils.getUserIdFromJwtToken(token);
                attributes.put("ws-username", username);
                attributes.put("ws-userId", userId);
                log.info("[WS HANDSHAKE] WebSocket handshake for user={}, id={}", username, userId);
            }
        } catch (Exception ex) {
            log.error("[WS HANDSHAKE] Exception during handshake validation: {}", ex.getMessage(), ex);
            return false;
        }
        return true;
    }

    @Override
    public void afterHandshake(org.springframework.http.server.ServerHttpRequest request,
                               org.springframework.http.server.ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // no-op
    }
}
