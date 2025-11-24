package com.sep490.wcpms.event;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerContractEventListener {

    private final CustomerRepository customerRepository;
    private final ContractRepository contractRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional
    @EventListener
    public void onContractRequestCreated(ContractRequestCreatedEvent event) {
        log.info("[CUSTOMER-NOTIFY] onContractRequestCreated: contractId={}, customerId={}",
                event.getContractId(), event.getCustomerId());

        try {
            Customer customer = customerRepository.findById(event.getCustomerId())
                    .orElse(null);
            if (customer == null) {
                log.warn("[CUSTOMER-NOTIFY] Customer not found for id={}", event.getCustomerId());
                return;
            }

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(null);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.REGISTRATION_RECEIVED);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SERVICE);

            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.REGISTRATION);
            n.setRelatedId(event.getContractId());

            String subject = "Xác nhận đã tiếp nhận đăng ký dịch vụ cấp nước";
            LocalDateTime createdAt = event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now();

            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hệ thống đã tiếp nhận yêu cầu đăng ký đấu nối nước của Quý khách.%n" +
                            "Mã hợp đồng tạm thời: %s.%n" +
                            "Thời gian tiếp nhận: %s.%n%n" +
                            "Nhân viên dịch vụ sẽ liên hệ để xác nhận thông tin và hẹn lịch khảo sát trong thời gian sớm nhất.%n%n" +
                            "Trân trọng.",
                    event.getCustomerName(),
                    event.getContractNumber(),
                    createdAt.format(DATE_FMT)
            );

            n.setMessageSubject(subject);
            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onContractRequestCreated: {}", ex.getMessage(), ex);
        }
    }

    @Transactional
    @EventListener
    public void onSurveyReportSubmitted(SurveyReportSubmittedEvent event) {
        log.info("[CUSTOMER-NOTIFY] onSurveyReportSubmitted: contractId={}, contractNumber={}",
                event.getContractId(), event.getContractNumber());

        try {
            Optional<Contract> optContract = contractRepository.findById(event.getContractId());
            if (optContract.isEmpty()) {
                log.warn("[CUSTOMER-NOTIFY] Contract not found for id={}", event.getContractId());
                return;
            }
            Contract contract = optContract.get();
            Customer customer = contract.getCustomer();
            if (customer == null) {
                log.warn("[CUSTOMER-NOTIFY] Contract id={} has no customer", contract.getId());
                return;
            }

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(null);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.TECHNICAL_SURVEY_RESULT);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.TECHNICAL);

            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
            n.setRelatedId(contract.getId());

            LocalDateTime submittedAt = event.getSubmittedAt() != null ? event.getSubmittedAt() : LocalDateTime.now();

            String subject = "Kết quả khảo sát kỹ thuật cấp nước";
            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Khảo sát kỹ thuật cho Hợp đồng cấp nước số %s đã hoàn tất ngày %s.%n" +
                            "Kết quả khảo sát và dự toán chi phí đã được cập nhật trên hệ thống.%n" +
                            "Nhân viên dịch vụ sẽ liên hệ để trao đổi chi tiết và hướng dẫn bước tiếp theo.%n%n" +
                            "Trân trọng.",
                    event.getCustomerName(),
                    event.getContractNumber(),
                    submittedAt.toLocalDate().format(DATE_FMT)
            );

            n.setMessageSubject(subject);
            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onSurveyReportSubmitted: {}", ex.getMessage(), ex);
        }
    }

    @Transactional
    @EventListener
    public void onSurveyReportApproved(SurveyReportApprovedEvent event) {
        log.info("[CUSTOMER-NOTIFY] onSurveyReportApproved: contractId={}, contractNumber={}",
                event.getContractId(), event.getContractNumber());

        try {
            Optional<Contract> optContract = contractRepository.findById(event.getContractId());
            if (optContract.isEmpty()) {
                log.warn("[CUSTOMER-NOTIFY] Contract not found for id={}", event.getContractId());
                return;
            }
            Contract contract = optContract.get();
            Customer customer = contract.getCustomer();
            if (customer == null) {
                log.warn("[CUSTOMER-NOTIFY] Contract id={} has no customer", contract.getId());
                return;
            }

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(null);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.CONTRACT_READY_TO_SIGN);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SERVICE);

            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
            n.setRelatedId(contract.getId());

            String subject = "Hợp đồng cấp nước sẵn sàng để ký";
            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hợp đồng cấp nước số %s đã được phê duyệt và sẵn sàng để ký kết.%n" +
                            "Quý khách vui lòng liên hệ quầy giao dịch hoặc làm theo hướng dẫn của nhân viên dịch vụ để thực hiện ký hợp đồng.%n%n" +
                            "Trân trọng.",
                    event.getCustomerName(),
                    event.getContractNumber()
            );

            n.setMessageSubject(subject);
            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onSurveyReportApproved: {}", ex.getMessage(), ex);
        }
    }

    @Transactional
    @EventListener
    public void onInstallationCompleted(InstallationCompletedEvent event) {
        log.info("[CUSTOMER-NOTIFY] onInstallationCompleted: contractId={}, contractNumber={}",
                event.getContractId(), event.getContractNumber());

        try {
            Optional<Contract> optContract = contractRepository.findById(event.getContractId());
            if (optContract.isEmpty()) {
                log.warn("[CUSTOMER-NOTIFY] Contract not found for id={}", event.getContractId());
                return;
            }
            Contract contract = optContract.get();
            Customer customer = contract.getCustomer();
            if (customer == null) {
                log.warn("[CUSTOMER-NOTIFY] Contract id={} has no customer", contract.getId());
                return;
            }

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(null);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.CONTRACT_ACTIVATED);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SERVICE);

            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
            n.setRelatedId(contract.getId());

            LocalDate effectiveDate = contract.getStartDate();
            if (effectiveDate == null && event.getCompletedAt() != null) {
                effectiveDate = event.getCompletedAt().toLocalDate();
            }

            String effectiveDateStr = effectiveDate != null ? effectiveDate.format(DATE_FMT) : "";

            String subject = "Xác nhận hợp đồng cấp nước đã có hiệu lực";
            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hợp đồng cấp nước số %s đã được lắp đặt hoàn tất và có hiệu lực từ ngày %s.%n" +
                            "Từ kỳ ghi nước tiếp theo, việc tính tiền nước sẽ được thực hiện theo hợp đồng đã ký.%n%n" +
                            "Trân trọng.",
                    event.getCustomerName(),
                    event.getContractNumber(),
                    effectiveDateStr
            );

            n.setMessageSubject(subject);
            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onInstallationCompleted: {}", ex.getMessage(), ex);
        }
    }
}

