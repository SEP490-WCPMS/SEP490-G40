package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Notification;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.NotificationRepository;
import com.sep490.wcpms.service.NotificationStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationStorageServiceImpl implements NotificationStorageService {

    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification saveForReceiver(Integer receiverAccountId, ServiceNotificationDTO dto) {
        log.info("[NOTI-PERSIST] START receiverId={}, type={}, contractId={}, hasExtra={}",
                receiverAccountId, dto.getType(), dto.getContractId(), dto.getExtra() != null);
        try {
            Account receiver = accountRepository.findById(receiverAccountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + receiverAccountId));

            log.info("[NOTI-PERSIST] Found account id={}, username={}", receiver.getId(), receiver.getUsername());

            Notification n = new Notification();
            n.setReceiverAccount(receiver);
            n.setTitle(dto.getType());
            n.setMessage(dto.getMessage());
            n.setType(Notification.NotificationType.CONTRACT);
            n.setReferenceId(dto.getContractId() != null ? dto.getContractId().longValue() : null);
            n.setReferenceType(Notification.ReferenceType.CONTRACT);
            n.setRead(false);

            Notification saved = notificationRepository.save(n);
            // Không cần flush() vì đang trong transaction của saveForReceiver,
            // Spring sẽ tự commit khi method kết thúc

            log.info("[NOTI-PERSIST] SUCCESS savedId={}, receiverId={}, receiverUsername={}, type={}, referenceId={}, read={}",
                    saved.getId(), receiver.getId(), receiver.getUsername(), dto.getType(), saved.getReferenceId(), saved.isRead());
            return saved;
        } catch (Exception e) {
            log.error("[NOTI-PERSIST] FAIL receiverId={}, type={}, error={}", receiverAccountId, dto.getType(), e.getMessage(), e);
            throw new RuntimeException("Failed to persist notification", e);
        }
    }
}
