package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import com.sep490.wcpms.entity.Account;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable; // <-- Import Pageable
import org.springframework.data.jpa.repository.Query; // <-- Import Query
import org.springframework.data.repository.query.Param; // <-- Import Param

import java.time.LocalDate; // <-- Import LocalDate
import java.time.LocalDateTime; // <-- add
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository // <-- Thêm @Repository nếu thiếu
public interface ContractRepository extends JpaRepository<Contract, Integer> {
    Optional<Contract> findByContractNumber(String contractNumber);

    boolean existsByContractNumber(String contractNumber);

    /**
     * Tìm danh sách hợp đồng/yêu cầu được gán cho một Kỹ thuật viên
     * với một trạng thái cụ thể.
     */
    List<Contract> findByTechnicalStaffAndContractStatus(Account technicalStaff, Contract.ContractStatus contractStatus);

    // --- CÁC PHƯƠNG THỨC CHO THỐNG KÊ DASHBOARD ---

    /** Đếm số hợp đồng được gán cho nhân viên với trạng thái cụ thể */
    long countByTechnicalStaffAndContractStatus(Account technicalStaff, Contract.ContractStatus contractStatus);

    // --- CÁC PHƯƠNG THỨC CHO BIỂU ĐỒ DASHBOARD (Technical) ---

    /** Đếm số khảo sát hoàn thành vào một ngày cụ thể (Technical view) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.technicalStaff = :staff AND c.contractStatus = 'PENDING_SURVEY_REVIEW' AND c.surveyDate = :date")
    long countCompletedSurveysByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    /** Đếm số lắp đặt hoàn thành vào một ngày cụ thể (Technical view) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.technicalStaff = :staff AND c.contractStatus = 'ACTIVE' AND c.installationDate = :date")
    long countCompletedInstallationsByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    // --- CÁC PHƯƠNG THỨC CHO BẢNG CÔNG VIỆC GẦN ĐÂY ---

    /** Tìm hợp đồng được gán cho nhân viên với các trạng thái cụ thể, có phân trang */
    List<Contract> findByTechnicalStaffAndContractStatusIn(
            Account technicalStaff,
            Collection<Contract.ContractStatus> statuses, // Danh sách các trạng thái
            Pageable pageable // Dùng Pageable để giới hạn và sắp xếp
    );

    /** Tìm hợp đồng được gán cho nhân viên với một trạng thái, có phân trang */
    List<Contract> findByTechnicalStaffAndContractStatus(
            Account technicalStaff,
            Contract.ContractStatus contractStatus,
            Pageable pageable // Dùng Pageable để giới hạn và sắp xếp
    );

    /**
     * Tìm hợp đồng của khách hàng DỰA TRÊN MỘT DANH SÁCH các trạng thái
     */
    List<Contract> findByCustomer_Account_IdAndContractStatusInOrderByIdDesc(Integer accountId, Collection<Contract.ContractStatus> statuses);

    List<Contract> findByCustomer_Account_IdOrderByIdDesc(Integer accountId);

    // Tìm các hợp đồng chưa có khách hàng (Guest) và trạng thái nằm trong danh sách truyền vào
    List<Contract> findByCustomerIsNullAndContractStatusIn(List<Contract.ContractStatus> statuses);

    // --- SERVICE STAFF METHODS ---

    /** Đếm số hợp đồng của service staff với trạng thái cụ thể */
    long countByServiceStaffAndContractStatus(Account serviceStaff, Contract.ContractStatus contractStatus);

    /** Tìm hợp đồng của service staff với các trạng thái cụ thể, có phân trang */
    List<Contract> findByServiceStaffAndContractStatusIn(
            Account serviceStaff,
            Collection<Contract.ContractStatus> statuses,
            Pageable pageable
    );

    /** Tìm hợp đồng của service staff với một trạng thái, có phân trang */
    List<Contract> findByServiceStaffAndContractStatus(
            Account serviceStaff,
            Contract.ContractStatus contractStatus,
            Pageable pageable
    );

    /** Đếm số hợp đồng gửi khảo sát (PENDING) vào một ngày cụ thể (Service view - gửi đi) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'PENDING' AND CAST(c.createdAt AS date) = :date")
    long countSentToTechnicalByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    /** Đếm số hợp đồng được duyệt (APPROVED) vào một ngày cụ thể (Service view - duyệt) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'APPROVED' AND CAST(c.updatedAt AS date) = :date")
    long countApprovedByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    /** Đếm số hợp đồng gửi ký (PENDING_SIGN) vào một ngày cụ thể (Service view) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'PENDING_SIGN' AND CAST(c.updatedAt AS date) = :date")
    long countPendingSignByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    // --- BỔ SUNG: CÁC HÀM CHUẨN CHO BIỂU ĐỒ SERVICE STAFF ---

    /** Đếm số KHẢO SÁT HOÀN THÀNH (PENDING_SURVEY_REVIEW) theo ngày (Service view) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'PENDING_SURVEY_REVIEW' AND c.surveyDate = :date")
    long countSurveyCompletedByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    // Tìm hợp đồng của Guest (customer = null) và trạng thái là PENDING_SURVEY_REVIEW
    @Query("SELECT c FROM Contract c " +
            "WHERE c.customer IS NULL " +
            "AND c.contractStatus = com.sep490.wcpms.entity.Contract.ContractStatus.PENDING_SURVEY_REVIEW " +
            "ORDER BY c.applicationDate DESC")
    List<Contract> findPendingGuestContracts();

    /** Đếm số LẮP ĐẶT HOÀN THÀNH (ACTIVE) theo ngày (Service view) */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'ACTIVE' AND c.installationDate = :date")
    long countInstallationCompletedByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    List<Contract> findByCustomer_IdOrderByIdDesc(Integer customerId);

    List<Contract> findByCustomerIdAndContractStatus(Integer customerId, Contract.ContractStatus contractStatus);

    Page<Contract> findByContractStatus(Contract.ContractStatus contractStatus, Pageable pageable);

    List<Contract> findByContractStatusAndEndDateBetween(
            Contract.ContractStatus contractStatus,
            LocalDate from,
            LocalDate to
    );

    // --- THÊM HÀM NÀY ---
    /**
     * Lấy các Hợp đồng đang ACTIVE và CHƯA có hóa đơn lắp đặt (kiểm tra bảng Invoice).
     */
    @Query("SELECT c FROM Contract c " +
            "WHERE c.contractStatus = 'ACTIVE' " +
            "AND c.id NOT IN (SELECT i.contract.id FROM Invoice i WHERE i.contract IS NOT NULL)")
    Page<Contract> findActiveContractsWithoutInvoice(Pageable pageable);

    // Aggregate contracts by status between dates (createdAt)
    @Query("SELECT c.contractStatus, COUNT(c) FROM Contract c WHERE c.createdAt BETWEEN :from AND :to GROUP BY c.contractStatus")
    List<Object[]> countContractsGroupedByStatus(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    // Aggregate contracts count grouped by created date (DATE portion) between datetimes
    @Query("SELECT FUNCTION('DATE', c.createdAt), COUNT(c) FROM Contract c WHERE c.createdAt BETWEEN :from AND :to GROUP BY FUNCTION('DATE', c.createdAt) ORDER BY FUNCTION('DATE', c.createdAt)")
    List<Object[]> countContractsGroupedByCreatedDate(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Direct count by status (simple and efficient)
    long countByContractStatus(Contract.ContractStatus contractStatus);

    /**
     * Tìm Hợp đồng được gán cho Technical Staff cụ thể, theo Trạng thái
     * VÀ tìm kiếm theo Keyword (Mã HĐ, Tên KH, Địa chỉ)
     */
    // === SỬA LẠI QUERY ĐỂ FIX LỖI CLOB/TEXT ===
    @Query("SELECT c FROM Contract c " +
            "LEFT JOIN c.customer cu " +   // <--- QUAN TRỌNG: LEFT JOIN để lấy cả Guest
            "LEFT JOIN c.address ad " +    // LEFT JOIN bảng Address
            "WHERE c.technicalStaff.id = :staffId " +
            "AND c.contractStatus = :status " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "    (cu IS NOT NULL AND LOWER(cu.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "    (cu IS NOT NULL AND LOWER(cu.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "    (LOWER(c.contractNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            // Tìm kiếm trong cột Notes (nơi chứa tên Guest), dùng CAST để tránh lỗi CLOB
            "    (LOWER(CAST(c.notes AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "    (c.contactPhone LIKE CONCAT('%', :keyword, '%')) OR " +
            "    (ad IS NOT NULL AND LOWER(ad.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            ")")
    Page<Contract> findByTechnicalStaffAndStatusWithSearch(
            @Param("staffId") Integer staffId,
            @Param("status") Contract.ContractStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Đếm số Hợp đồng ACTIVE được gán cho Kế toán này nhưng chưa có hóa đơn lắp đặt (CN%, meterReading NULL)
     * và hợp đồng có contractValue > 0
     */
    @Query("""
    SELECT COUNT(c) FROM Contract c
    WHERE c.contractStatus = 'ACTIVE'
      AND c.accountingStaff.id = :staffId
      AND c.contractValue IS NOT NULL
      AND c.contractValue > 0
      AND NOT EXISTS (
          SELECT 1 FROM Invoice i
          WHERE i.contract = c
            AND i.meterReading IS NULL
            AND UPPER(i.invoiceNumber) LIKE 'CN%'
      )
""")
    long countPendingInstallationBillsByStaff(@Param("staffId") Integer staffId);


    /**
     * Lấy danh sách hợp đồng đủ điều kiện lập hóa đơn lắp đặt:
     * ACTIVE + assigned staff + contractValue > 0 + chưa có invoice lắp đặt CN% (meterReading NULL)
     */
    @Query("""
    SELECT c FROM Contract c
    WHERE c.contractStatus = 'ACTIVE'
      AND c.accountingStaff.id = :staffId
      AND c.contractValue IS NOT NULL
      AND c.contractValue > 0
      AND NOT EXISTS (
          SELECT 1 FROM Invoice i
          WHERE i.contract = c
            AND i.meterReading IS NULL
            AND UPPER(i.invoiceNumber) LIKE 'CN%'
      )
""")
    Page<Contract> findActiveContractsWithoutInstallationInvoiceByStaff(
            @Param("staffId") Integer staffId,
            Pageable pageable
    );

    // Đếm số lượng hợp đồng chưa có khách hàng (Guest) và trạng thái nằm trong danh sách
    long countByCustomerIsNullAndContractStatusIn(Collection<Contract.ContractStatus> statuses);

}