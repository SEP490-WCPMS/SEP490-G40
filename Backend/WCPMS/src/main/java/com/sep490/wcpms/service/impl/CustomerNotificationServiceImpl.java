package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CustomerNotificationDTO;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.service.CustomerNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerNotificationServiceImpl implements CustomerNotificationService {

    private final CustomerNotificationRepository notificationRepository;

    @Override
    public List<CustomerNotificationDTO> getNotificationsForAccount(Integer accountId) {
        List<CustomerNotification> list =
                notificationRepository.findByCustomer_Account_IdOrderByCreatedAtDesc(accountId);
        return list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerNotificationDTO> getNotificationsForCustomer(Integer customerId) {
        List<CustomerNotification> list =
                notificationRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId);
        return list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerNotificationDTO getNotificationById(Integer id) {
        CustomerNotification entity = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        return toDto(entity);
    }

    private CustomerNotificationDTO toDto(CustomerNotification n) {
        CustomerNotificationDTO dto = new CustomerNotificationDTO();
        dto.setId(n.getId());

        if (n.getCustomer() != null) {
            dto.setCustomerId(n.getCustomer().getId());
        }
        if (n.getInvoice() != null) {
            dto.setInvoiceId(n.getInvoice().getId());
        }

        dto.setMessageType(n.getMessageType());
        dto.setIssuerRole(n.getIssuerRole());
        dto.setMessageSubject(n.getMessageSubject());
        dto.setMessageContent(n.getMessageContent());
        dto.setRelatedType(n.getRelatedType());
        dto.setRelatedId(n.getRelatedId());
        dto.setAttachmentUrl(n.getAttachmentUrl());
        dto.setStatus(n.getStatus());
        dto.setSentDate(n.getSentDate());
        dto.setErrorMessage(n.getErrorMessage());
        dto.setCreatedAt(n.getCreatedAt());

        return dto;
    }
}
