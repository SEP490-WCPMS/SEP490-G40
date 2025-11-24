package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerNotificationEmailServiceImpl implements CustomerNotificationEmailService {

    private final JavaMailSender mailSender;
    private final CustomerNotificationRepository notificationRepository;

    @Override
    public void sendEmail(CustomerNotification notification) {
        try {
            String toEmail = notification.getCustomer().getAccount().getEmail(); // tùy mô hình

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(notification.getMessageSubject());
            helper.setText(notification.getMessageContent(), false);

            if (notification.getAttachmentUrl() != null && !notification.getAttachmentUrl().isBlank()) {
                File file = new File(notification.getAttachmentUrl());
                if (file.exists()) {
                    helper.addAttachment(file.getName(), new FileSystemResource(file));
                } else {
                    log.warn("Attachment not found: {}", file.getAbsolutePath());
                }
            }

            mailSender.send(message);

            notification.setStatus(CustomerNotification.CustomerNotificationStatus.SENT);
            notification.setSentDate(LocalDateTime.now());
            notification.setErrorMessage(null);
            notificationRepository.save(notification);

        } catch (Exception ex) {
            log.error("Error sending email notification id={}", notification.getId(), ex);
            notification.setStatus(CustomerNotification.CustomerNotificationStatus.FAILED);
            notification.setErrorMessage(ex.getMessage());
            notificationRepository.save(notification);
        }
    }
}

