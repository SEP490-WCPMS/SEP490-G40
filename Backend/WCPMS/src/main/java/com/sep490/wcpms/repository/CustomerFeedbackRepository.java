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
     * Tìm Ticket được gán cho nhân viên cụ thể (assignedTo) theo trạng thái
     * VÀ tìm kiếm theo Keyword (Mã, Nội dung, Tên KH) <--- ĐIỂM MỚI
     */
    @Query("SELECT t FROM CustomerFeedback t " +
            "WHERE t.assignedTo = :assignedTo " +
            "AND t.status = :status " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(t.feedbackNumber) LIKE %:keyword% OR " +
            "     LOWER(t.description) LIKE %:keyword% OR " +
            "     LOWER(t.customer.customerName) LIKE %:keyword%)")
    Page<CustomerFeedback> findAssignedToAndStatusWithSearch(
            @Param("assignedTo") Account assignedTo,
            @Param("status") CustomerFeedback.Status status,
            @Param("keyword") String keyword,
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

    // --- THÊM HÀM MỚI NÀY (QUAN TRỌNG) ---
    /**
     * Tìm ticket của Customer VÀ nằm trong danh sách trạng thái cho trước.
     * Tương tự: findByCustomerAndPaymentStatusIn bên InvoiceRepository
     */
    Page<CustomerFeedback> findByCustomer_IdAndStatusIn(
            Integer customerId,
            Collection<CustomerFeedback.Status> statuses,
            Pageable pageable
    );
    // ------------------------------------

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

    // --- THÊM HÀM MỚI NÀY ĐỂ LỌC THEO STATUS VÀ TYPE ---
    /**
     * Tìm ticket theo một Trạng thái cố định (ví dụ: PENDING)
     * VÀ nằm trong danh sách các Loại (FeedbackType) được truyền vào.
     */
    Page<CustomerFeedback> findByStatusAndFeedbackTypeIn(
            CustomerFeedback.Status status,
            Collection<CustomerFeedback.FeedbackType> feedbackTypes,
            Pageable pageable
    );
    // ---------------------------------------------------

    // Thêm hàm này vào Interface Repository
    @Query("SELECT f FROM CustomerFeedback f " +
            "WHERE f.customer.id = :customerId " +
            // Logic lọc Status: Nếu danh sách rỗng hoặc null thì lấy hết
            "AND (:statuses IS NULL OR f.status IN :statuses) " +
            // Logic tìm kiếm Keyword: Tìm trong Mã phiếu HOẶC Nội dung
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(f.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(f.feedbackNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<CustomerFeedback> searchMyTickets(
            @Param("customerId") Integer customerId,
            @Param("statuses") List<CustomerFeedback.Status> statuses,
            @Param("keyword") String keyword,
            Pageable pageable
    );


    /**
     * Tìm Ticket được gán cho nhân viên cụ thể (assignedTo.id = :staffId)
     * Lọc theo danh sách Type (nếu có)
     * Chỉ lấy trạng thái PENDING hoặc IN_PROGRESS (việc cần làm)
     */
    @Query("SELECT t FROM CustomerFeedback t " +
            "WHERE t.assignedTo.id = :staffId " +
            "AND t.status IN ('PENDING', 'IN_PROGRESS') " +
            "AND (:types IS NULL OR t.feedbackType IN :types)" +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(t.feedbackNumber) LIKE %:keyword% OR " +
            "     LOWER(t.description) LIKE %:keyword% OR " +
            "     LOWER(t.customer.account.phone) LIKE %:keyword% OR " +
            "     LOWER(t.customer.customerName) LIKE %:keyword%)")
    Page<CustomerFeedback> findAssignedTickets(
            @Param("staffId") Integer staffId,
            @Param("types") List<CustomerFeedback.FeedbackType> types,
            @Param("keyword") String keyword,
            Pageable pageable
    );

}