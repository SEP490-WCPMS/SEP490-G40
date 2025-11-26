package com.sep490.wcpms.config;

import com.sep490.wcpms.websocket.JwtHandshakeInterceptor;
import com.sep490.wcpms.websocket.UserHandshakeHandler;
import com.sep490.wcpms.websocket.StompConnectAuthInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Autowired
    private UserHandshakeHandler userHandshakeHandler;

    @Autowired
    private StompConnectAuthInterceptor stompConnectAuthInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple in-memory broker; for multi-instance use brokerRelay (RabbitMQ)
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws-notifications")
                .setHandshakeHandler(userHandshakeHandler)
                .addInterceptors(jwtHandshakeInterceptor)
                // Important: use setAllowedOriginPatterns("*") instead of setAllowedOrigins("*")
                // to avoid CORS issues when the browser sends dynamic Origin (proxy, dev hostnames)
                .setAllowedOriginPatterns("*");
                // Removed .withSockJS() to use native WebSocket
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompConnectAuthInterceptor);
    }
}
