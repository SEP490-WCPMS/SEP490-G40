package com.sep490.wcpms.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * Custom HandshakeHandler that sets Principal name from attributes set by JwtHandshakeInterceptor.
 */
@Component
public class UserHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(org.springframework.http.server.ServerHttpRequest request,
                                      org.springframework.web.socket.WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        Object usernameObj = attributes.get("ws-username");
        if (usernameObj != null) {
            String username = usernameObj.toString();
            return new StompPrincipal(username);
        }
        return super.determineUser(request, wsHandler, attributes);
    }

    private static class StompPrincipal implements Principal {
        private final String name;

        StompPrincipal(String name) { this.name = name; }

        @Override
        public String getName() { return name; }
    }
}
