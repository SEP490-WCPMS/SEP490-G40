package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.NotificationDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.StaffNotification;
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

import java.time.LocalDateTime;

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

        String username;
        if (auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            username = userDetails.getUsername();
        } else {
            // principal could be a String username
            username = auth.getName();
        }

        return accountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Account not found: " + username));
    }

    private NotificationDTO map(StaffNotification n) {
        if (n == null) return null;
        String type = n.getType() != null ? n.getType().name() : null;
        String refType = n.getReferenceType() != null ? n.getReferenceType().name() : null;
        Long refId = n.getReferenceId();
        boolean read = n.isRead();
        LocalDateTime createdAt = n.getCreatedAt();
        LocalDateTime readAt = n.getReadAt();
        Integer actorId = n.getActorAccount() != null ? n.getActorAccount().getId().intValue() : null;

        return new NotificationDTO(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                type,
                refId,
                refType,
                read,
                createdAt,
                readAt,
                actorId
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
