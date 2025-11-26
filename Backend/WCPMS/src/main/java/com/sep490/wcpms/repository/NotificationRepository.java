package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.StaffNotification;
import com.sep490.wcpms.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<StaffNotification, Long> {
    Page<StaffNotification> findByReceiverAccountOrderByCreatedAtDesc(Account account, Pageable pageable);
    long countByReceiverAccountAndReadFalse(Account account);

    @Modifying
    @Query("update StaffNotification n set n.read = true, n.readAt = CURRENT_TIMESTAMP where n.id = :id")
    void markReadById(Long id);

    @Modifying
    @Query("update StaffNotification n set n.read = true, n.readAt = CURRENT_TIMESTAMP where n.receiverAccount = :account and n.read = false")
    void markAllRead(Account account);
}
