package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.InternalNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InternalNotificationRepository extends JpaRepository<InternalNotification, Integer> {

    // Lấy thông báo: Hoặc gửi đúng ID cụ thể, Hoặc gửi chung cho Role cụ thể (mà không chỉ định ID ai cả)
    @Query("SELECT n FROM InternalNotification n WHERE " +
            "(n.recipientId = :userId) OR " +
            "(n.recipientId IS NULL AND (" +
            "    n.recipientRole = :roleName OR " +
            "    n.recipientRole = CONCAT('ROLE_', :roleName) OR " +
            "    ( :roleName LIKE 'ROLE_%' AND n.recipientRole = SUBSTRING(:roleName, 6) )" +
            ")) " +
            "ORDER BY n.createdAt DESC")
    List<InternalNotification> findNotificationsForUser(@Param("userId") Integer userId, @Param("roleName") String roleName);

    // Đếm số chưa đọc
    @Query("SELECT COUNT(n) FROM InternalNotification n WHERE " +
            "n.isRead = false AND " +
            "((n.recipientId = :userId) OR (n.recipientId IS NULL AND (" +
            "    n.recipientRole = :roleName OR " +
            "    n.recipientRole = CONCAT('ROLE_', :roleName) OR " +
            "    ( :roleName LIKE 'ROLE_%' AND n.recipientRole = SUBSTRING(:roleName, 6) )" +
            "))) ")
    long countUnread(@Param("userId") Integer userId, @Param("roleName") String roleName);

    boolean existsByReferenceIdAndReferenceTypeAndRecipientId(Integer referenceId,
                                                              InternalNotification.NotificationType referenceType,
                                                              Integer recipientId);

    boolean existsByReferenceIdAndReferenceTypeAndRecipientRole(Integer referenceId,
                                                                InternalNotification.NotificationType referenceType,
                                                                String recipientRole);
}