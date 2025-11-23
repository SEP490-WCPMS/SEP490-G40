package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.CustomerNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerNotificationRepository extends JpaRepository<CustomerNotification, Integer> {

    List<CustomerNotification> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId);

    List<CustomerNotification> findByStatus(CustomerNotification.CustomerNotificationStatus status);
}
