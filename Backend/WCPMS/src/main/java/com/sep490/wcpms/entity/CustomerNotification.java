package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_notifications")
@Getter
@Setter
public class CustomerNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Invoice liên quan (nếu có)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 50)
    private CustomerNotificationMessageType messageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "issuer_role", nullable = false, length = 50)
    private CustomerNotificationIssuerRole issuerRole;

    @Column(name = "message_subject", nullable = false, length = 255)
    private String messageSubject;

    @Lob
    @Column(name = "message_content", nullable = false)
    private String messageContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_type", length = 50)
    private CustomerNotificationRelatedType relatedType = CustomerNotificationRelatedType.NONE;

    @Column(name = "related_id")
    private Integer relatedId;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private CustomerNotificationStatus status = CustomerNotificationStatus.PENDING;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum CustomerNotificationMessageType {
        REGISTRATION_RECEIVED,
        TECHNICAL_SURVEY_RESULT,
        CONTRACT_READY_TO_SIGN,
        CONTRACT_ACTIVATED,
        INSTALLATION_INVOICE_ISSUED,
        WATER_BILL_ISSUED,
        SERVICE_INVOICE_ISSUED,
        PAYMENT_REMINDER,
        CONTRACT_EXPIRY_REMINDER,
        LEAK_WARNING,
        GENERAL
    }

    public enum CustomerNotificationIssuerRole {
        SERVICE,
        TECHNICAL,
        ACCOUNTANT,
        SYSTEM
    }

    public enum CustomerNotificationRelatedType {
        CONTRACT,
        WATER_SERVICE_CONTRACT,
        METER_READING,
        REGISTRATION,
        NONE
    }

    public enum CustomerNotificationStatus {
        PENDING,
        SENT,
        FAILED
    }
}
