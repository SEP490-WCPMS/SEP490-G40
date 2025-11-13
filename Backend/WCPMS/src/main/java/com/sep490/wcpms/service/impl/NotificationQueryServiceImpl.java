package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.NotificationDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Notification;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.NotificationRepository;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import com.sep490.wcpms.service.NotificationQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationQueryServiceImpl implements NotificationQueryService {

    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;

    private Account currentAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }

        // ✅ Case 1: Principal là UserDetailsImpl (Spring Security tạo)
        if (auth.getPrincipal() instanceof UserDetailsImpl user) {
            Account acc = accountRepository.findById(user.getId())
                    .orElseThrow(() -> new IllegalStateException("Account not found: " + user.getId()));
            log.debug("[NOTI-QUERY] currentAccount id={}, username={}", acc.getId(), acc.getUsername());
            return acc;
        }

        // ✅ Case 2: Principal là String username (Controller set)
        String username = auth.getName(); // getName() lấy username từ principal
        Account acc = accountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Account not found: " + username));
        log.debug("[NOTI-QUERY] currentAccount id={}, username={}", acc.getId(), acc.getUsername());
        return acc;
    }

    private NotificationDTO map(Notification n) {
        return new NotificationDTO(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType() != null ? n.getType().name() : null,
                n.getReferenceId(),
                n.getReferenceType() != null ? n.getReferenceType().name() : null,
                n.isRead(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getMyNotifications(int page, int size) {
        Account acc = currentAccount();
        log.debug("[NOTI-QUERY] Fetching notifications for accountId={}, page={}, size={}", acc.getId(), page, size);
        Page<NotificationDTO> result = notificationRepository.findByReceiverAccountOrderByCreatedAtDesc(acc, PageRequest.of(page, size))
                .map(this::map);
        log.debug("[NOTI-QUERY] Found {} notifications for accountId={}", result.getTotalElements(), acc.getId());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public long getMyUnreadCount() {
        Account acc = currentAccount();
        return notificationRepository.countByReceiverAccountAndReadFalse(acc);
    }

    @Override
    @Transactional
    public void markRead(Long id) {
        notificationRepository.markReadById(id);
    }

    @Override
    @Transactional
    public void markAllRead() {
        Account acc = currentAccount();
        notificationRepository.markAllRead(acc);
    }
}
