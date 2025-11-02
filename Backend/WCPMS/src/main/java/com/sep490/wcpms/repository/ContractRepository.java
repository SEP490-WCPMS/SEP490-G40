package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import com.sep490.wcpms.entity.Account;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable; // <-- Import Pageable
import org.springframework.data.jpa.repository.Query; // <-- Import Query
import org.springframework.data.repository.query.Param; // <-- Import Param

import java.time.LocalDate; // <-- Import LocalDate
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

    // --- CÁC PHƯƠNG THỨC CHO BIỂU ĐỒ DASHBOARD ---

    /** Đếm số khảo sát hoàn thành vào một ngày cụ thể */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.technicalStaff = :staff AND c.contractStatus = 'PENDING_SURVEY_REVIEW' AND c.surveyDate = :date")
    long countCompletedSurveysByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    /** Đếm số lắp đặt hoàn thành vào một ngày cụ thể */
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

    /** Đếm số hợp đồng gửi khảo sát (PENDING) vào một ngày cụ thể */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'PENDING' AND CAST(c.createdAt AS date) = :date")
    long countSentToTechnicalByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    /** Đếm số hợp đồng được duyệt (APPROVED) vào một ngày cụ thể */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.serviceStaff = :staff AND c.contractStatus = 'APPROVED' AND CAST(c.updatedAt AS date) = :date")
    long countApprovedByDate(
            @Param("staff") Account staff,
            @Param("date") LocalDate date
    );

    List<Contract> findByCustomer_IdOrderByIdDesc(Integer customerId);
}