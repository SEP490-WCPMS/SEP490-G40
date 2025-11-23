package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerNotificationRepository extends JpaRepository<CustomerNotification, Integer> {

    // Lấy theo customer_id
    List<CustomerNotification> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId);

    // Lấy theo status (PENDING, SENT, FAILED)
    List<CustomerNotification> findByStatus(CustomerNotification.CustomerNotificationStatus status);

    // Lấy theo account_id của Customer (1 account có thể có nhiều customer)
    List<CustomerNotification> findByCustomer_Account_IdOrderByCreatedAtDesc(Integer accountId);

    boolean existsByInvoiceAndMessageType(Invoice invoice, CustomerNotification.CustomerNotificationMessageType messageType);

    boolean existsByRelatedTypeAndRelatedIdAndMessageType(
            CustomerNotification.CustomerNotificationRelatedType relatedType,
            Integer relatedId,
            CustomerNotification.CustomerNotificationMessageType messageType
    );
}
