package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.StaffNotification;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.NotificationRepository;
import com.sep490.wcpms.service.NotificationStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationStorageServiceImpl implements NotificationStorageService {

    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StaffNotification saveForReceiver(Integer receiverAccountId, ServiceNotificationDTO dto) {
        log.info("[NOTI-PERSIST] START receiverId={}, type={}, contractId={}, hasExtra={}",
                receiverAccountId, dto.getType(), dto.getContractId(), dto.getExtra() != null);
        try {
            Account receiver = accountRepository.findById(receiverAccountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + receiverAccountId));

            log.info("[NOTI-PERSIST] Found account id={}, username={}", receiver.getId(), receiver.getUsername());

            StaffNotification n = new StaffNotification();
            n.setReceiverAccount(receiver);
            // title is short label for UI
            n.setTitle(dto.getType() != null ? dto.getType() : "NOTIFICATION");
            n.setMessage(dto.getMessage() != null ? dto.getMessage() : "");

            // Map DTO.type (string) to enum NotificationType
            StaffNotification.NotificationType mappedType = mapToNotificationType(dto.getType());
            n.setType(mappedType);

            // reference id & type
            if (dto.getContractId() != null) {
                n.setReferenceId(dto.getContractId().longValue());
                n.setReferenceType(StaffNotification.ReferenceType.CONTRACT);
            } else {
                n.setReferenceId(null);
                n.setReferenceType(StaffNotification.ReferenceType.NONE);
            }

            // If dto.extra contains actorAccountId, set actorAccount and mark read for actor
            Integer actorAccountId = null;
            if (dto.getExtra() != null) {
                Object obj = dto.getExtra().get("actorAccountId");
                if (obj instanceof Integer) {
                    actorAccountId = (Integer) obj;
                    accountRepository.findById(actorAccountId).ifPresent(n::setActorAccount);
                }
            }

            // default unread; if receiver is actor -> mark read to avoid increasing unread count
            if (actorAccountId != null && actorAccountId.equals(receiverAccountId)) {
                n.setRead(true);
            } else {
                n.setRead(false);
            }

            StaffNotification saved = notificationRepository.save(n);

            log.info("[NOTI-PERSIST] SUCCESS savedId={}, receiverId={}, receiverUsername={}, type={}, referenceId={}, read={}",
                    saved.getId(), receiver.getId(), receiver.getUsername(), saved.getType(), saved.getReferenceId(), saved.isRead());
            return saved;
        } catch (Exception e) {
            log.error("[NOTI-PERSIST] FAIL receiverId={}, type={}, error={}", receiverAccountId, dto.getType(), e.getMessage(), e);
            throw new RuntimeException("Failed to persist notification", e);
        }
    }

    private StaffNotification.NotificationType mapToNotificationType(String type) {
        if (type == null) return StaffNotification.NotificationType.SYSTEM;
        return switch (type.toUpperCase().trim()) {
            case "CONTRACT", "CONTRACT_REQUEST_CREATED" -> StaffNotification.NotificationType.CONTRACT;
            case "INVOICE" -> StaffNotification.NotificationType.INVOICE;
            case "MAINTENANCE" -> StaffNotification.NotificationType.MAINTENANCE;
            case "PAYMENT" -> StaffNotification.NotificationType.PAYMENT;
            case "SUPPORT" -> StaffNotification.NotificationType.SUPPORT;
            case "TASK", "TASK_CLAIMED" -> StaffNotification.NotificationType.TASK;
            case "SYSTEM" -> StaffNotification.NotificationType.SYSTEM;
            default -> StaffNotification.NotificationType.SYSTEM;
        };
    }
}
