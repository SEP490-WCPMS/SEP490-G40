package com.sep490.wcpms.websocket;

import com.sep490.wcpms.security.jwt.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class StompConnectAuthInterceptor implements ChannelInterceptor {
    private static final Logger log = LoggerFactory.getLogger(StompConnectAuthInterceptor.class);

    private final JwtUtils jwtUtils;

    public StompConnectAuthInterceptor(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Use getFirstNativeHeader to avoid List.get(0) and static analysis warning
            String header = accessor.getFirstNativeHeader("Authorization");
            String token = null;
            if (header != null && !header.isBlank()) {
                if (header.startsWith("Bearer ")) {
                    token = header.substring(7);
                } else {
                    token = header; // accept raw token as well
                }
            }

            if (token == null || token.isBlank()) {
                log.warn("[WS CONNECT] Missing Authorization header in STOMP CONNECT");
                throw new MessagingException("Missing Authorization token");
            }

            if (!jwtUtils.validateJwtToken(token)) {
                log.warn("[WS CONNECT] Invalid JWT token in STOMP CONNECT");
                throw new MessagingException("Invalid JWT token");
            }

            String username = jwtUtils.getUserNameFromJwtToken(token);
            // Create Authentication principal
            UsernamePasswordAuthenticationToken principal = new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
            accessor.setUser(principal);
            log.info("[WS CONNECT] STOMP CONNECT authenticated for user={}", username);
        }
        return message;
    }
}
