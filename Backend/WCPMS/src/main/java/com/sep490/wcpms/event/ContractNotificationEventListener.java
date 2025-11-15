package com.sep490.wcpms.event;

import com.sep490.wcpms.dto.ServiceNotificationDTO;
import com.sep490.wcpms.service.ServiceStaffNotificationService;
import com.sep490.wcpms.service.NotificationStorageService; // đổi tên interface
import com.sep490.wcpms.repository.AccountRepository; // thêm
import com.sep490.wcpms.entity.Role; // thêm
import com.sep490.wcpms.entity.Account; // thêm
import com.sep490.wcpms.entity.Notification; // import để dùng id sau persist
import com.sep490.wcpms.controller.NotificationController; // 🔔 Import SSE controller để gửi realtime
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractNotificationEventListener {

    private final ServiceStaffNotificationService notificationService;
    private final NotificationStorageService notificationPersistenceService; // giữ biến nhưng kiểu mới
    private final AccountRepository accountRepository; // inject repo để lấy danh sách Service Staff

    // Yêu cầu hợp đồng mới từ Khách hàng
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContractRequestCreated(ContractRequestCreatedEvent event) {
        log.info("[EVENT LISTENER] onContractRequestCreated triggered: contractId={}, customer={}, eventTimestamp={}",
                event.getContractId(), event.getCustomerName(), event.getCreatedAt());

        // Tạo DTO để broadcast realtime (id=null vì persist cho nhiều người nhận)
        // ✅ Dùng HashMap thường thay vì double-brace để tránh tạo class ẩn, dễ GC
        java.util.HashMap<String, Object> createdExtras = new java.util.HashMap<>();
        createdExtras.put("customerId", event.getCustomerId());
        createdExtras.put("customerName", event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng");
        createdExtras.put("contractNumber", event.getContractNumber() != null ? event.getContractNumber() : "N/A");

        ServiceNotificationDTO dto = new ServiceNotificationDTO(
                null,
                "CONTRACT_REQUEST_CREATED",
                buildMessage("CONTRACT_REQUEST_CREATED", event.getCustomerName()),
                LocalDateTime.now(),
                event.getContractId(),
                createdExtras
        );

        // Broadcast realtime cho client đang online (FE lưu localStorage)
        log.info("[EVENT LISTENER] Broadcasting SSE for CONTRACT_REQUEST_CREATED contractId={}", event.getContractId());
        notificationService.broadcast(dto);

        // Persist cho TẤT CẢ Service Staff để khi reconnect vẫn thấy lịch sử
        try {
            log.info("[EVENT LISTENER] Starting persist for all SERVICE_STAFF...");
            List<Account> serviceStaffList = accountRepository.findByRole_RoleName(Role.RoleName.SERVICE_STAFF);
            log.info("[EVENT LISTENER] Found SERVICE_STAFF count={}", serviceStaffList != null ? serviceStaffList.size() : 0);

            if (serviceStaffList != null && !serviceStaffList.isEmpty()) {
                serviceStaffList.forEach(acc -> {
                    if (acc != null && acc.getId() != null) {
                        log.info("[EVENT LISTENER] Will persist for STAFF id={}, username={}", acc.getId(), acc.getUsername());
                    }
                });

                int saved = 0;
                for (Account acc : serviceStaffList) {
                    if (acc != null && acc.getId() != null) {
                        try {
                            Notification result = notificationPersistenceService.saveForReceiver(acc.getId(), dto);
                            if (result != null) {
                                saved++;
                                log.info("[EVENT LISTENER] Persisted successfully for staffId={}, notificationId={}", acc.getId(), result.getId());
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

            // ✅ FIX LỖI #5: Thêm debug logs
            if (event.getServiceStaffId() == null) {
                log.warn("[EVENT LISTENER] ⚠️ WARNING: serviceStaffId is NULL! Will broadcast to ALL SERVICE_STAFF");
            } else {
                log.info("[EVENT LISTENER] ✅ serviceStaffId={} (sẽ persist cho 1 người)", event.getServiceStaffId());
            }

            // ✅ Dùng HashMap
            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("technicalStaffId", event.getTechnicalStaffId());
            extras.put("serviceStaffId", event.getServiceStaffId());

            send("TECH_SURVEY_COMPLETED", event.getContractId(), customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] ❌ Error in onSurveyReportSubmitted: {}", ex.getMessage(), ex);
        }
    }

    // Dịch vụ duyệt khảo sát (PENDING_SURVEY_REVIEW -> APPROVED)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSurveyReportApproved(SurveyReportApprovedEvent event) {
        log.info("[EVENT LISTENER] onSurveyReportApproved triggered: contractId={}, serviceStaffId={}",
                event.getContractId(), event.getServiceStaffId());

        try {
            // ✅ Null-check
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            // ❗ Dịch vụ thao tác → chỉ broadcast UI (không persist DB)
            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("serviceStaffId", event.getServiceStaffId());

            ServiceNotificationDTO dto = new ServiceNotificationDTO(
                    null,
                    "SURVEY_APPROVED",
                    buildMessage("SURVEY_APPROVED", customerName),
                    LocalDateTime.now(),
                    event.getContractId(),
                    extras
            );

            log.info("[EVENT LISTENER] 📡 Broadcasting SSE (UI only, no persist) type=SURVEY_APPROVED, contractId={}", event.getContractId());
            notificationService.broadcast(dto);
            // return không cần thiết vì kết thúc method
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] ❌ Error in onSurveyReportApproved: {}", ex.getMessage(), ex);
        }
    }

    // Khách hàng ký hợp đồng (APPROVED -> PENDING_CUSTOMER_SIGN -> PENDING_SIGN)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCustomerSigned(CustomerSignedContractEvent event) {
        log.info("[EVENT LISTENER] onCustomerSigned triggered: contractId={}, serviceStaffId={}",
                event.getContractId(), event.getServiceStaffId());
        
        try {
            // ✅ Null-check tất cả fields trước khi sử dụng
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";
            Integer serviceStaffId = event.getServiceStaffId();
            Integer contractId = event.getContractId();

            // 🔔 ✅ Dùng HashMap thay vì Map.of() để chấp nhận null values
            Map<String, Object> sseNotification = new java.util.HashMap<>();
            sseNotification.put("type", "CUSTOMER_SIGNED_CONTRACT");
            sseNotification.put("contractId", contractId);
            sseNotification.put("timestamp", LocalDateTime.now().toString());

            if (serviceStaffId != null) {
                sseNotification.put("message", "Khách hàng " + customerName + " vừa ký hợp đồng " + contractNumber);
                log.info("[EVENT LISTENER] 📡 Gửi SSE cho Service Staff id={}", serviceStaffId);
                NotificationController.broadcastNotification(serviceStaffId, sseNotification);
            } else {
                log.warn("[EVENT LISTENER] ⚠️ serviceStaffId is NULL, broadcast to all connected Service Staff");
                sseNotification.put("message", "Khách hàng " + customerName + " vừa ký hợp đồng");
                NotificationController.broadcastToAll(sseNotification);
            }

            // ✅ Persist to DB - dùng HashMap để chấp nhận null
            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("serviceStaffId", serviceStaffId);

            send("CUSTOMER_SIGNED_CONTRACT", contractId, customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] ❌ Error in onCustomerSigned: {}", ex.getMessage(), ex);
        }
    }

    // Dịch vụ gửi lắp đặt (PENDING_SIGN -> SIGNED)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSentToInstallation(ContractSentToInstallationEvent event) {
        log.info("[EVENT LISTENER] onSentToInstallation triggered: contractId={}, serviceStaffId={}, techStaffId={}",
                event.getContractId(), event.getServiceStaffId(), event.getTechnicalStaffId());

        try {
            // ✅ Null-check trước khi sử dụng
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            // ❗ Dịch vụ thao tác → chỉ broadcast UI (không persist DB)
            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("serviceStaffId", event.getServiceStaffId());
            extras.put("technicalStaffId", event.getTechnicalStaffId());

            ServiceNotificationDTO dto = new ServiceNotificationDTO(
                    null,
                    "SENT_TO_INSTALLATION",
                    buildMessage("SENT_TO_INSTALLATION", customerName),
                    LocalDateTime.now(),
                    event.getContractId(),
                    extras
            );

            log.info("[EVENT LISTENER] 📡 Broadcasting SSE (UI only, no persist) type=SENT_TO_INSTALLATION, contractId={}", event.getContractId());
            notificationService.broadcast(dto);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] ❌ Error in onSentToInstallation: {}", ex.getMessage(), ex);
        }
    }

    // Kỹ thuật hoàn tất lắp đặt (SIGNED -> ACTIVE)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onInstallationCompleted(InstallationCompletedEvent event) {
        log.info("[EVENT LISTENER] onInstallationCompleted triggered: contractId={}, techStaffId={}, serviceStaffId={}",
                event.getContractId(), event.getTechnicalStaffId(), event.getServiceStaffId());

        try {
            // ✅ Null-check
            String contractNumber = event.getContractNumber() != null ? event.getContractNumber() : "N/A";
            String customerName = event.getCustomerName() != null ? event.getCustomerName() : "Khách hàng";

            // ✅ Dùng HashMap
            Map<String, Object> extras = new java.util.HashMap<>();
            extras.put("contractNumber", contractNumber);
            extras.put("technicalStaffId", event.getTechnicalStaffId());
            extras.put("serviceStaffId", event.getServiceStaffId());

            send("INSTALLATION_COMPLETED", event.getContractId(), customerName, extras);
        } catch (Exception ex) {
            log.error("[EVENT LISTENER] ❌ Error in onInstallationCompleted: {}", ex.getMessage(), ex);
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

            // 🔍 DEBUG LOG - Kiểm tra serviceStaffId
            log.info("[EVENT LISTENER] 🔍 DEBUG: serviceStaffId = {} (từ extra map)", serviceStaffId);
            if (serviceStaffId == null) {
                log.warn("[EVENT LISTENER] ⚠️ WARNING: serviceStaffId is NULL! Will persist for ALL SERVICE_STAFF");
            }

            // Nếu có serviceStaffId cụ thể → persist cho 1 người
            if (serviceStaffId != null) {
                log.info("[EVENT LISTENER] ✅ Persisting for specific serviceStaffId={}", serviceStaffId);

                ServiceNotificationDTO persistDto = new ServiceNotificationDTO(
                        null,
                        type,
                        buildMessage(type, customerName),
                        LocalDateTime.now(),
                        contractId,
                        extra
                );

                try {
                    Notification saved = notificationPersistenceService.saveForReceiver(serviceStaffId, persistDto);
                    Long id = saved != null ? saved.getId() : null;

                    // 🔍 DEBUG LOG - Kiểm tra persist thành công
                    if (saved != null) {
                        Integer receiverId = saved.getReceiverAccount() != null ? saved.getReceiverAccount().getId() : null;
                        log.info("[EVENT LISTENER] ✅ Saved successfully! notificationId={}, receiverAccountId={}",
                                saved.getId(), receiverId);
                    } else {
                        log.error("[EVENT LISTENER] ❌ ERROR: saveForReceiver returned NULL!");
                    }

                    // SSE dto có id DB để FE đồng bộ chuẩn
                    ServiceNotificationDTO sseDto = new ServiceNotificationDTO(
                            id,
                            type,
                            persistDto.getMessage(),
                            persistDto.getTimestamp(),
                            contractId,
                            extra
                    );

                    log.info("[EVENT LISTENER] 📡 Broadcasting SSE (single receiver) id={}, type={}, contractId={}, staffId={}",
                            id, sseDto.getType(), sseDto.getContractId(), serviceStaffId);
                    notificationService.broadcast(sseDto);
                    log.info("[EVENT LISTENER] ✅ Broadcast success for type={}", type);
                } catch (Exception e) {
                    log.error("[EVENT LISTENER] ❌ Failed to persist for staffId={}: {}", serviceStaffId, e.getMessage(), e);
                    // Nếu persist fail, vẫn broadcast SSE (FE lưu localStorage)
                    ServiceNotificationDTO fallbackDto = new ServiceNotificationDTO(
                            null, type, buildMessage(type, customerName),
                            LocalDateTime.now(), contractId, extra
                    );
                    notificationService.broadcast(fallbackDto);
                }
                return;
            }

            // Không có serviceStaffId → persist cho TẤT CẢ Service Staff (như CONTRACT_REQUEST_CREATED)
            log.warn("[EVENT LISTENER] ⚠️ No serviceStaffId, persisting for ALL Service Staff");

            ServiceNotificationDTO dto = new ServiceNotificationDTO(
                    null,
                    type,
                    buildMessage(type, customerName),
                    LocalDateTime.now(),
                    contractId,
                    extra
            );

            // Broadcast realtime trước
            log.info("[EVENT LISTENER] 📡 Broadcasting SSE (team-wide) type={}, contractId={}", type, contractId);
            notificationService.broadcast(dto);

            // Persist cho tất cả Service Staff
            try {
                List<Account> serviceStaffList = accountRepository.findByRole_RoleName(Role.RoleName.SERVICE_STAFF);
                log.info("[EVENT LISTENER] 🔍 Found {} SERVICE_STAFF accounts", serviceStaffList != null ? serviceStaffList.size() : 0);

                if (serviceStaffList != null && !serviceStaffList.isEmpty()) {
                    int saved = 0;
                    for (Account acc : serviceStaffList) {
                        if (acc != null && acc.getId() != null) {
                            try {
                                log.info("[EVENT LISTENER] 💾 Persisting for serviceStaff id={}, username={}", acc.getId(), acc.getUsername());
                                Notification result = notificationPersistenceService.saveForReceiver(acc.getId(), dto);
                                if (result != null) {
                                    saved++;
                                    log.info("[EVENT LISTENER] ✅ Persisted for id={}, notificationId={}", acc.getId(), result.getId());
                                } else {
                                    log.error("[EVENT LISTENER] ❌ saveForReceiver returned NULL for id={}", acc.getId());
                                }
                            } catch (Exception e) {
                                log.error("[EVENT LISTENER] ❌ Failed to persist for id={}: {}", acc.getId(), e.getMessage(), e);
                            }
                        }
                    }
                    log.info("[EVENT LISTENER] ✅ Total persisted for {}/{} accounts", saved, serviceStaffList.size());
                } else {
                    log.error("[EVENT LISTENER] ❌ No SERVICE_STAFF found in database!");
                }
            } catch (Exception ex) {
                log.error("[EVENT LISTENER] ❌ Error persisting for all: ", ex);
            }

        } catch (Exception ex) {
            log.error("[EVENT LISTENER] Gửi thông báo thất bại: type={}, contractId={}, error={}",
                    type, contractId, ex.getMessage(), ex);
        }
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
}

