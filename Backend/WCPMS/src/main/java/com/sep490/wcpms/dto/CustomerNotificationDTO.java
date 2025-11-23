package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.CustomerNotification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerNotificationDTO {

    private Integer id;

    private Integer customerId;
    private Integer invoiceId;

    private CustomerNotification.CustomerNotificationMessageType messageType;
    private CustomerNotification.CustomerNotificationIssuerRole issuerRole;

    private String messageSubject;
    private String messageContent;

    private CustomerNotification.CustomerNotificationRelatedType relatedType;
    private Integer relatedId;

    private String attachmentUrl;

    private CustomerNotification.CustomerNotificationStatus status;
    private LocalDateTime sentDate;
    private String errorMessage;
    private LocalDateTime createdAt;
}

