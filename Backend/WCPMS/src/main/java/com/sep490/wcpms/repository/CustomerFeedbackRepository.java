package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerFeedback;
import com.sep490.wcpms.entity.WaterMeter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT f FROM CustomerFeedback f " +
            "WHERE f.assignedTo = :staff " +
            "AND f.status = :status " +
            "AND f.waterMeter.meterCode = :meterCode")
    List<CustomerFeedback> findByStaffStatusAndMeter(
            @Param("staff") Account staff,
            @Param("status") CustomerFeedback.Status status,
            @Param("meterCode") String meterCode
    );

    // --- THÊM HÀM MỚI (CHỐNG SPAM) ---
    /**
     * Kiểm tra xem có tồn tại ticket nào
     * cho một đồng hồ (WaterMeter) cụ thể
     * VÀ đang ở 1 trong các trạng thái (PENDING, IN_PROGRESS) hay không.
     * @param waterMeter Đối tượng đồng hồ (Bảng 12)
     * @param statuses Danh sách trạng thái [PENDING, IN_PROGRESS]
     * @return true nếu tồn tại, false nếu không
     */
    boolean existsByWaterMeterAndStatusIn(
            WaterMeter waterMeter,
            Collection<CustomerFeedback.Status> statuses
    );
    // --- HẾT PHẦN THÊM ---

}