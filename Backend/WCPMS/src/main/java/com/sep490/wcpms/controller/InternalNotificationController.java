package com.sep490.wcpms.controller;

import com.sep490.wcpms.entity.InternalNotification;
import com.sep490.wcpms.repository.InternalNotificationRepository;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internal-notifications") // URL rõ ràng
@RequiredArgsConstructor
public class InternalNotificationController {

    private final InternalNotificationRepository repo;

    // Lấy danh sách thông báo của user hiện tại
    @GetMapping
    public ResponseEntity<List<InternalNotification>> getMyNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();

        String roleName = userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a != null && !a.isBlank())
                // nếu có cả ROLE_ADMIN và ADMIN thì ưu tiên ADMIN
                .sorted((a, b) -> {
                    boolean aRole = a.startsWith("ROLE_");
                    boolean bRole = b.startsWith("ROLE_");
                    return Boolean.compare(aRole, bRole);
                })
                .findFirst()
                .orElse(null);

        return ResponseEntity.ok(repo.findNotificationsForUser(userDetails.getId(), roleName));
    }

    // Đếm số thông báo chưa đọc
    @GetMapping("/unread-count")
    public ResponseEntity<Long> countUnread(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) return ResponseEntity.ok(0L);

        String roleName = userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a != null && !a.isBlank())
                .sorted((a, b) -> {
                    boolean aRole = a.startsWith("ROLE_");
                    boolean bRole = b.startsWith("ROLE_");
                    return Boolean.compare(aRole, bRole);
                })
                .findFirst()
                .orElse(null);

        return ResponseEntity.ok(repo.countUnread(userDetails.getId(), roleName));
    }

    // Đánh dấu đã đọc
    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        repo.findById(id).ifPresent(n -> {
            n.setRead(true);
            repo.save(n);
        });
        return ResponseEntity.ok().build();
    }
}