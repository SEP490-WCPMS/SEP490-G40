package com.sep490.wcpms.scheduler;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.CustomerNotificationSmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractExpiryNotificationScheduler {

    private final ContractRepository contractRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final CustomerNotificationSmsService smsNotificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int REMIND_DAYS = 10;

    // Chạy hằng ngày lúc 08:00 sáng
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendContractExpiryReminders() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate to = today.plusDays(REMIND_DAYS);

            List<Contract> contracts = contractRepository.findByContractStatusAndEndDateBetween(
                    Contract.ContractStatus.ACTIVE,
                    today.plusDays(1),
                    to
            );

            for (Contract contract : contracts) {
                processContract(contract);
            }

        } catch (Exception ex) {
            log.error("[CONTRACT-EXPIRY] Error in scheduler: {}", ex.getMessage(), ex);
        }
    }

    private void processContract(Contract contract) {
        try {
            if (contract.getEndDate() == null || contract.getCustomer() == null) {
                return;
            }

            boolean exists = notificationRepository.existsByRelatedTypeAndRelatedIdAndMessageType(
                    CustomerNotification.CustomerNotificationRelatedType.CONTRACT,
                    contract.getId(),
                    CustomerNotification.CustomerNotificationMessageType.CONTRACT_EXPIRY_REMINDER
            );
            if (exists) {
                return;
            }

            LocalDate today = LocalDate.now();
            long daysLeft = ChronoUnit.DAYS.between(today, contract.getEndDate());
            if (daysLeft <= 0 || daysLeft > REMIND_DAYS) {
                return;
            }

            Customer customer = contract.getCustomer();

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(null);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.CONTRACT_EXPIRY_REMINDER);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);

            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
            n.setRelatedId(contract.getId());

            String endDateStr = contract.getEndDate().format(DATE_FMT);

            String subject = "Thông báo hợp đồng sắp hết hạn";
            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hợp đồng cấp nước số %s của Quý khách có ngày hết hạn là %s.%n" +
                            "Tính đến ngày hiện tại, hợp đồng còn khoảng %d ngày nữa sẽ hết hạn.%n%n" +
                            "Nếu Quý khách có nhu cầu tiếp tục sử dụng dịch vụ, vui lòng liên hệ để gia hạn hợp đồng trước thời điểm hết hạn.%n%n" +
                            "Trân trọng.",
                    customer.getCustomerName(),
                    contract.getContractNumber(),
                    endDateStr,
                    daysLeft
            );

            n.setMessageSubject(subject);
            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);
            smsNotificationService.sendForNotification(n);

        } catch (Exception ex) {
            log.error("[CONTRACT-EXPIRY] Error processing contract id={}: {}",
                    contract.getId(), ex.getMessage(), ex);
        }
    }
}
