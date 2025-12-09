package com.sep490.wcpms.event;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.CustomerNotificationSmsService;
import com.sep490.wcpms.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

    // Dùng cho SMS trực tiếp (guest)
    private final SmsService smsService;

    // Dùng cho SMS theo CustomerNotification (customer)
    private final CustomerNotificationSmsService smsNotificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ============================================================
    // 1) KH tạo yêu cầu hợp đồng (ContractRequestCreatedEvent)
    // ============================================================

    @Transactional
    @EventListener
    public void onContractRequestCreated(ContractRequestCreatedEvent event) {
        log.info("[CUSTOMER-NOTIFY] onContractRequestCreated: contractId={}, customerId={}",
                event.getContractId(), event.getCustomerId());

        try {
            // --- CASE 1: Guest (không có customerId) → gửi SMS trực tiếp ---
            if (event.getCustomerId() == null) {
                log.info("[CUSTOMER-NOTIFY] Yêu cầu từ Guest. Gửi SMS trực tiếp qua SmsService.");

                Optional<Contract> optContract = contractRepository.findById(event.getContractId());
                if (optContract.isEmpty()) {
                    log.warn("[CUSTOMER-NOTIFY] Contract not found for id={} (guest request)", event.getContractId());
                    return;
                }
                Contract contract = optContract.get();

                String phone = contract.getContactPhone();
                if (phone == null || phone.isBlank()) {
                    log.warn("[CUSTOMER-NOTIFY] Guest contract id={} không có contactPhone, không gửi SMS được.", contract.getId());
                    return;
                }

                String smsContent = String.format(
                        "Cap nuoc Phu Tho: Da tiep nhan yeu cau dau noi nuoc ma hop dong tam %s. " +
                                "Nhan vien se lien he de xac nhan thong tin va hen lich khao sat.",
                        event.getContractNumber()
                );
                smsService.sendSms(phone, smsContent);
                return;
            }

            // --- CASE 2: Customer đã có trong hệ thống ---
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
            smsNotificationService.sendForNotification(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onContractRequestCreated: {}", ex.getMessage(), ex);
        }
    }

    // ============================================================
    // 2) Nhân viên kỹ thuật nộp biên bản khảo sát (SurveyReportSubmittedEvent)
    // ============================================================

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

            // --- CASE 1: Guest (contract chưa link Customer) → gửi SMS trực tiếp ---
            if (customer == null) {
                log.info("[CUSTOMER-NOTIFY] Survey result for Guest contract id={}", contract.getId());

                String phone = contract.getContactPhone();
                if (phone == null || phone.isBlank()) {
                    log.warn("[CUSTOMER-NOTIFY] Guest contract id={} không có contactPhone, không gửi SMS được.", contract.getId());
                    return;
                }

                LocalDateTime submittedAt = event.getSubmittedAt() != null ? event.getSubmittedAt() : LocalDateTime.now();
                String dateStr = submittedAt.toLocalDate().format(DATE_FMT);

                String smsContent = String.format(
                        "Cap nuoc Phu Tho: Da hoan tat khao sat ky thuat cho yeu cau dau noi nuoc ma hop dong %s ngay %s. " +
                                "Nhan vien se lien he de trao doi ket qua va huong dan buoc tiep theo.",
                        event.getContractNumber(),
                        dateStr
                );
                smsService.sendSms(phone, smsContent);
                return;
            }

            // --- CASE 2: Customer đã có tài khoản ---
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
            smsNotificationService.sendForNotification(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onSurveyReportSubmitted: {}", ex.getMessage(), ex);
        }
    }

    // ============================================================
    // 3) Báo cáo khảo sát được phê duyệt – hợp đồng sẵn sàng để ký
    // ============================================================

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

            // Guest: gửi SMS trực tiếp (nếu có SĐT), không tạo CustomerNotification
            if (customer == null) {
                log.info("[CUSTOMER-NOTIFY] Survey approved for Guest contract id={}", contract.getId());

                String phone = contract.getContactPhone();
                if (phone == null || phone.isBlank()) {
                    log.warn("[CUSTOMER-NOTIFY] Guest contract id={} không có contactPhone, không gửi SMS được.", contract.getId());
                    return;
                }

                String smsContent = String.format(
                        "Cap nuoc Phu Tho: Ho so dau noi nuoc ma hop dong %s da duoc phe duyet va san sang ky. " +
                                "Vui long lien he quay giao dich hoac nhan vien dich vu de duoc huong dan ky hop dong.",
                        event.getContractNumber()
                );
                smsService.sendSms(phone, smsContent);
                return;
            }

            // Customer: dùng CustomerNotification
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
            smsNotificationService.sendForNotification(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onSurveyReportApproved: {}", ex.getMessage(), ex);
        }
    }

    // ============================================================
    // 4) Hoàn tất lắp đặt – hợp đồng có hiệu lực
    // ============================================================

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

            LocalDate effectiveDate = contract.getStartDate();
            if (effectiveDate == null && event.getCompletedAt() != null) {
                effectiveDate = event.getCompletedAt().toLocalDate();
            }
            String effectiveDateStr = effectiveDate != null ? effectiveDate.format(DATE_FMT) : "";

            // Guest: gửi SMS trực tiếp
            if (customer == null) {
                log.info("[CUSTOMER-NOTIFY] Installation completed for Guest contract id={}", contract.getId());

                String phone = contract.getContactPhone();
                if (phone == null || phone.isBlank()) {
                    log.warn("[CUSTOMER-NOTIFY] Guest contract id={} không có contactPhone, không gửi SMS được.", contract.getId());
                    return;
                }

                String smsContent = String.format(
                        "Cap nuoc Phu Tho: Yeu cau dau noi nuoc ma hop dong %s da duoc lap dat hoan tat va co hieu luc tu ngay %s. " +
                                "Hoa don tien nuoc se duoc tinh tu ky doc nuoc ke tiep.",
                        event.getContractNumber(),
                        effectiveDateStr
                );
                smsService.sendSms(phone, smsContent);
                return;
            }

            // Customer: tạo CustomerNotification
            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(null);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.CONTRACT_ACTIVATED);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SERVICE);

            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
            n.setRelatedId(contract.getId());

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
            smsNotificationService.sendForNotification(n);

        } catch (Exception ex) {
            log.error("[CUSTOMER-NOTIFY] Error in onInstallationCompleted: {}", ex.getMessage(), ex);
        }
    }
}