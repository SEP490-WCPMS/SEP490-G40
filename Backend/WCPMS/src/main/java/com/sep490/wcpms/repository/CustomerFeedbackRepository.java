package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.CustomerFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional; // <-- THÊM IMPORT

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Integer> {

    /**
     * Kiểm tra xem ticket với mã số này đã tồn tại chưa (dùng cho Tác vụ Tự động).
     */
    boolean existsByFeedbackNumber(String feedbackNumber);

    /**
     * Lấy các ticket theo Loại và Trạng thái (cho Service Staff xem ticket PENDING).
     */
    Page<CustomerFeedback> findByFeedbackTypeAndStatus(
            CustomerFeedback.FeedbackType feedbackType,
            CustomerFeedback.Status status,
            Pageable pageable
    );

    /**
     * Lấy các ticket được gán cho một nhân viên cụ thể và theo trạng thái (cho Technical Staff).
     */
    Page<CustomerFeedback> findByAssignedToAndStatus(
            Account assignedTo,
            CustomerFeedback.Status status,
            Pageable pageable
    );

    // --- THÊM 2 HÀM MỚI CHO CUSTOMER ---

    /**
     * Lấy danh sách ticket (phân trang) của một Khách hàng cụ thể.
     */
    Page<CustomerFeedback> findByCustomer_Id(Integer customerId, Pageable pageable);

    /**
     * Lấy chi tiết 1 ticket, đảm bảo ticket này đúng là của Khách hàng đó.
     */
    Optional<CustomerFeedback> findByIdAndCustomer_Id(Integer ticketId, Integer customerId);

    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy TẤT CẢ các ticket (cả FEEDBACK và SUPPORT_REQUEST)
     * đang ở trạng thái PENDING.
     */
    Page<CustomerFeedback> findByStatus(CustomerFeedback.Status status, Pageable pageable);
    // --- HẾT PHẦN THÊM ---
}