package com.sep490.wcpms.websocket;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks connected websocket users (by username principal).
 */
@Service
public class ConnectedUserService {

    private final Set<String> users = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void add(String username) {
        if (username != null) users.add(username);
    }

    public void remove(String username) {
        if (username != null) users.remove(username);
    }

    public int count() {
        return users.size();
    }

    public Set<String> list() {
        return Collections.unmodifiableSet(users);
    }
}

