package com.sep490.wcpms.event;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import com.sep490.wcpms.service.NotificationStorageService; // đổi tên interface
import com.sep490.wcpms.repository.AccountRepository; // thêm
import com.sep490.wcpms.entity.Role; // thêm
import com.sep490.wcpms.entity.Account; // thêm
import com.sep490.wcpms.entity.StaffNotification; // import để dùng id sau persist
import com.sep490.wcpms.service.NotificationWebSocketService; // new
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractNotificationEventListener {

    private final NotificationStorageService notificationPersistenceService; // giữ biến nhưng kiểu mới
    private final AccountRepository accountRepository; // inject repo để lấy danh sách Service Staff
    private final NotificationWebSocketService websocketService; // send realtime

    // Yêu cầu hợp đồng mới từ Khách hàng
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContractRequestCreated(ContractRequestCreatedEvent event) {
        log.info("[EVENT LISTENER] onContractRequestCreated triggered: contractId={}, customer={}, eventTimestamp={}",
                event.getContractId(), event.getCustomerName(), event.getCreatedAt());

        // Build DTO and persist to DB for all service staff (transport-agnostic)
        java.util.HashMap<String, Object> createdExtras = new java.util.HashMap<>();
        createdExtras.put("customerId", event.getCustomerId());
        createdExtras.put("customerName", event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng");
        createdExtras.put("contractNumber", event.getContractNumber() != null ? event.getContractNumber() : "N/A");
        // ContractRequest is created by customer; actorAccountId is customerId (not staff)
        createdExtras.put("actorAccountId", event.getCustomerId());

        ServiceNotificationDTO dto = new ServiceNotificationDTO(
                null,
                "CONTRACT_REQUEST_CREATED",
                buildMessage("CONTRACT_REQUEST_CREATED", event.getCustomerName()),
                LocalDateTime.now(),
                event.getContractId(),
                createdExtras
        );

        // Persist notifications to DB so users can see history after reconnect
        try {
            log.info("[EVENT LISTENER] Starting persist for all SERVICE_STAFF...");
            List<Account> serviceStaffList = accountRepository.findByRole_RoleName(Role.RoleName.SERVICE_STAFF);
            log.info("[EVENT LISTENER] Found SERVICE_STAFF count={}", serviceStaffList != null ? serviceStaffList.size() : 0);

            if (serviceStaffList != null && !serviceStaffList.isEmpty()) {
                int saved = 0;
                for (Account acc : serviceStaffList) {
                    if (acc != null && acc.getId() != null) {
                        try {
                            StaffNotification result = notificationPersistenceService.saveForReceiver(acc.getId(), dto);
                            if (result != null) {
                                saved++;
                                log.info("[EVENT LISTENER] Persisted successfully for staffId={}, notificationId={}", acc.getId(), result.getId());

                                // send websocket to specific user (use username lookup)
                                String username = result.getReceiverAccount() != null ? result.getReceiverAccount().getUsername() : null;
                                if (username != null) {
                                    // Skip realtime send if this account is the actor (self-notify)
                                    boolean skipRealtime = false;
                                    Object actorObj = createdExtras.get("actorAccountId");
                                    if (actorObj instanceof Integer actorId) {
                                        if (actorId.equals(acc.getId())) {
                                            skipRealtime = true;
                                            log.debug("[EVENT LISTENER] Skipping realtime self-notify for accountId={}", acc.getId());
                                        }
                                    }

                                    if (!skipRealtime) {
                                        websocketService.sendToUser(username, buildPayload(result, "CONTRACT_REQUEST_CREATED", acc.getId()));
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("[EVENT LISTENER] Failed to persist for staffId={}: {}", acc.getId(), e.getMessage(), e);
                        }
                    }
                }
                log.info("[EVENT LISTENER] Persisted CONTRACT_REQUEST_CREATED for {}/{} service staff", saved, serviceStaffList.size());
            } else {
                log.warn("[EVENT LISTENER] No SERVICE_STAFF found in database! Cannot persist notification.");
            }
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Persist CONTRACT_REQUEST_CREATED failed with exception:", ex);
        }
    }

    // Kỹ thuật nộp báo cáo khảo sát (PENDING -> PENDING_SURVEY_REVIEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSurveyReportSubmitted(SurveyReportSubmittedEvent event) {
        log.info("[EVENT LISTENER] onSurveyReportSubmitted triggered: contractId={}, techStaffId={}, serviceStaffId={}",
                event.getContractId(), event.getTechnicalStaffId(), event.getServiceStaffId());

        try {
            // ✅ Null-check
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            if (event.getServiceStaffId() == null) {
                log.warn("[EVENT LISTENER] serviceStaffId is NULL; will persist for all service staff");
            } else {
                log.info("[EVENT LISTENER] serviceStaffId={} (persist for single receiver)", event.getServiceStaffId());
            }

            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("technicalStaffId", event.getTechnicalStaffId());
            extras.put("serviceStaffId", event.getServiceStaffId());
            // actor is the technical staff who submitted the survey
            if (event.getTechnicalStaffId() != null) {
                extras.put("actorAccountId", event.getTechnicalStaffId());
            }

            send(typeForSurvey(), event.getContractId(), customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Error in onSurveyReportSubmitted: {}", ex.getMessage(), ex);
        }
    }

    // Dịch vụ duyệt khảo sát (PENDING_SURVEY_REVIEW -> APPROVED)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSurveyReportApproved(SurveyReportApprovedEvent event) {
        log.info("[EVENT LISTENER] onSurveyReportApproved triggered: contractId={}, serviceStaffId={}",
                event.getContractId(), event.getServiceStaffId());

        try {
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("serviceStaffId", event.getServiceStaffId());
            // actor is the service staff who approved
            if (event.getServiceStaffId() != null) {
                extras.put("actorAccountId", event.getServiceStaffId());
            }

            send("SURVEY_APPROVED", event.getContractId(), customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Error in onSurveyReportApproved: {}", ex.getMessage(), ex);
        }
    }

    // Khách hàng ký hợp đồng (APPROVED -> PENDING_CUSTOMER_SIGN -> PENDING_SIGN)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCustomerSigned(CustomerSignedContractEvent event) {
        log.info("[EVENT LISTENER] onCustomerSigned triggered: contractId={}, serviceStaffId={}",
                event.getContractId(), event.getServiceStaffId());

        try {
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";
            Integer serviceStaffId = event.getServiceStaffId();
            Integer contractId = event.getContractId();

            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("serviceStaffId", serviceStaffId);
            // actor is the customer who signed the contract -> use customerAccountId
            if (event.getCustomerAccountId() != null) {
                extras.put("actorAccountId", event.getCustomerAccountId());
            }

            send("CUSTOMER_SIGNED_CONTRACT", contractId, customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Error in onCustomerSigned: {}", ex.getMessage(), ex);
        }
    }

    // Dịch vụ gửi lắp đặt (PENDING_SIGN -> SIGNED)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSentToInstallation(ContractSentToInstallationEvent event) {
        log.info("[EVENT LISTENER] onSentToInstallation triggered: contractId={}, serviceStaffId={}, techStaffId={}",
                event.getContractId(), event.getServiceStaffId(), event.getTechnicalStaffId());

        try {
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("serviceStaffId", event.getServiceStaffId());
            extras.put("technicalStaffId", event.getTechnicalStaffId());
            // actor is likely the service staff who sent to installation (if present), otherwise technical
            if (event.getServiceStaffId() != null) {
                extras.put("actorAccountId", event.getServiceStaffId());
            } else if (event.getTechnicalStaffId() != null) {
                extras.put("actorAccountId", event.getTechnicalStaffId());
            }

            send("SENT_TO_INSTALLATION", event.getContractId(), customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Error in onSentToInstallation: {}", ex.getMessage(), ex);
        }
    }

    // Kỹ thuật hoàn tất lắp đặt (SIGNED -> ACTIVE)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onInstallationCompleted(InstallationCompletedEvent event) {
        log.info("[EVENT LISTENER] onInstallationCompleted triggered: contractId={}, techStaffId={}, serviceStaffId={}",
                event.getContractId(), event.getTechnicalStaffId(), event.getServiceStaffId());

        try {
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("technicalStaffId", event.getTechnicalStaffId());
            extras.put("serviceStaffId", event.getServiceStaffId());
            // actor is the technical staff who completed installation
            if (event.getTechnicalStaffId() != null) {
                extras.put("actorAccountId", event.getTechnicalStaffId());
            }

            send("INSTALLATION_COMPLETED", event.getContractId(), customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Error in onInstallationCompleted: {}", ex.getMessage(), ex);
        }
    }

    private void send(String type, Integer contractId, String customerName, Map<String, Object> extra) {
        try {
            log.info("[EVENT LISTENER] Sending {} for contract {} (customer={})", type, contractId, customerName);

            // Lấy serviceStaffId từ extra (có thể null)
            Integer serviceStaffId = null;
            if (extra != null && extra.containsKey("serviceStaffId")) {
                Object staffIdObj = extra.get("serviceStaffId");
                if (staffIdObj instanceof Integer) {
                    serviceStaffId = (Integer) staffIdObj;
                }
            }

            log.info("[EVENT LISTENER] DEBUG: serviceStaffId = {} (from extra)", serviceStaffId);

            // Nếu có serviceStaffId cụ thể → persist cho 1 người
            if (serviceStaffId != null) {
                log.info("[EVENT LISTENER] Persisting for specific serviceStaffId={}", serviceStaffId);

                ServiceNotificationDTO persistDto = new ServiceNotificationDTO(
                        null,
                        type,
                        buildMessage(type, customerName),
                        LocalDateTime.now(),
                        contractId,
                        extra
                );

                try {
                    StaffNotification saved = notificationPersistenceService.saveForReceiver(serviceStaffId, persistDto);
                    if (saved != null) {
                        Integer receiverId = saved.getReceiverAccount() != null ? saved.getReceiverAccount().getId() : null;
                        log.info("[EVENT LISTENER] Saved successfully! notificationId={}, receiverAccountId={}",
                                saved.getId(), receiverId);

                        // send websocket to specific user (use username lookup)
                        String username = saved.getReceiverAccount() != null ? saved.getReceiverAccount().getUsername() : null;
                        if (username != null) {
                            websocketService.sendToUser(username, buildPayload(saved, type, serviceStaffId));
                        }
                    } else {
                        log.error("[EVENT LISTENER] ERROR: saveForReceiver returned NULL!");
                    }

                    log.info("[EVENT LISTENER] Persist complete for type={} (single receiver)", type);
                } catch (Exception e) {
                    log.error("[EVENT LISTENER] Failed to persist for staffId={}: {}", serviceStaffId, e.getMessage(), e);
                }
                return;
            }

            // No serviceStaffId → persist for all service staff
            log.warn("[EVENT LISTENER] No serviceStaffId; persisting for all service staff");

            ServiceNotificationDTO dto = new ServiceNotificationDTO(
                    null,
                    type,
                    buildMessage(type, customerName),
                    LocalDateTime.now(),
                    contractId,
                    extra
            );

            try {
                List<Account> serviceStaffList = accountRepository.findByRole_RoleName(Role.RoleName.SERVICE_STAFF);
                log.info("[EVENT LISTENER] Found {} SERVICE_STAFF accounts", serviceStaffList != null ? serviceStaffList.size() : 0);

                if (serviceStaffList != null && !serviceStaffList.isEmpty()) {
                    int saved = 0;
                    for (Account acc : serviceStaffList) {
                        if (acc != null && acc.getId() != null) {
                            try {
                                log.info("[EVENT LISTENER] Persisting for serviceStaff id={}, username={}", acc.getId(), acc.getUsername());
                                StaffNotification result = notificationPersistenceService.saveForReceiver(acc.getId(), dto);
                                if (result != null) {
                                    saved++;
                                    log.info("[EVENT LISTENER] Persisted for id={}, notificationId={}", acc.getId(), result.getId());

                                    // send websocket broadcast for the group/topic and also to specific user if connected
                                    // Skip realtime send when this account is the actor (if provided in extra as actorAccountId)
                                    boolean skipRealtime = false;
                                    Object actorObj = extra != null ? extra.get("actorAccountId") : null;
                                    if (actorObj instanceof Integer) {
                                        Integer actorId = (Integer) actorObj;
                                        if (actorId != null && actorId.equals(acc.getId())) {
                                            skipRealtime = true;
                                            log.debug("[EVENT LISTENER] Skipping realtime self-notify for accountId={}", acc.getId());
                                        }
                                    }

                                    if (!skipRealtime) {
                                        websocketService.sendToTopic("service-staff", buildPayload(result, type, acc.getId()));

                                        if (acc.getUsername() != null) {
                                            websocketService.sendToUser(acc.getUsername(), buildPayload(result, type, acc.getId()));
                                        }

                                    } else {
                                        // still persisted for history, but skip realtime
                                    }

                                } else {
                                    log.error("[EVENT LISTENER] saveForReceiver returned NULL for id={}", acc.getId());
                                }
                            } catch (Exception e) {
                                log.error("[EVENT LISTENER] Failed to persist for id={}: {}", acc.getId(), e.getMessage(), e);
                            }
                        }
                    }
                    log.info("[EVENT LISTENER] Total persisted for {}/{} accounts", saved, serviceStaffList.size());
                } else {
                    log.error("[EVENT LISTENER] No SERVICE_STAFF found in database!");
                }
            } catch (Exception ex) {
                log.error("[EVENT LISTENER] Error persisting for all: ", ex);
            }

        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Sending notification failed: type={}, contractId={}, error={}",
                    type, contractId, ex.getMessage(), ex);
        }
    }

    private Map<String, Object> buildPayload(StaffNotification result, String defaultType, Integer receiverId) {
        Map<String, Object> p = new HashMap<>();
        p.put("id", result.getId());
        p.put("type", result.getType() != null ? result.getType().name() : defaultType);
        p.put("title", result.getTitle());
        p.put("message", result.getMessage());
        p.put("referenceId", result.getReferenceId());
        p.put("referenceType", result.getReferenceType() != null ? result.getReferenceType().name() : "NONE");
        p.put("createdAt", result.getCreatedAt());
        p.put("receiverId", receiverId);
        return p;
    }

    private String buildMessage(String type, String customerName) {
        return switch (type) {
            case "TECH_SURVEY_COMPLETED" -> "Kỹ thuật đã hoàn thành khảo sát cho khách hàng " + customerName;
            case "SURVEY_APPROVED" -> "Báo cáo khảo sát đã được duyệt cho khách hàng " + customerName;
            case "CUSTOMER_SIGNED_CONTRACT" -> "Khách hàng đã ký hợp đồng: " + customerName;
            case "SENT_TO_INSTALLATION" -> "Đã gửi lắp đặt cho khách hàng " + customerName;
            case "INSTALLATION_COMPLETED" -> "Đã hoàn tất lắp đặt cho khách hàng " + customerName;
            case "CONTRACT_REQUEST_CREATED" -> "Yêu cầu hợp đồng mới từ " + customerName;
            default -> type + ": " + customerName;
        };
    }

    // helper to keep meaning clear (could be replaced inline)
    private String typeForSurvey() {
        return "TECH_SURVEY_COMPLETED";
    }
}
