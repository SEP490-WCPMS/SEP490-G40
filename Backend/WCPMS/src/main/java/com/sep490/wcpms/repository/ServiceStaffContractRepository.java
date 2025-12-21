package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceStaffContractRepository extends JpaRepository<Contract, Integer> {

    // === 1. ADMIN/GENERAL (Giữ nguyên) ===
    @Query("SELECT DISTINCT c FROM Contract c " +
            "LEFT JOIN c.customer cu " +
            "LEFT JOIN c.address addr " +
            "LEFT JOIN c.contractUsageDetails cud " +
            "LEFT JOIN cud.priceType pt " +
            "LEFT JOIN c.serviceStaff ss " +
            "LEFT JOIN c.technicalStaff ts " +
            "WHERE (:status IS NULL OR c.contractStatus = :status) " +
            "AND ( " +
            "    :keyword IS NULL OR ( " +
            "      LOWER(COALESCE(c.contractNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(c.contactPhone, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      COALESCE(addr.address, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.street, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      LOWER(COALESCE(ss.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(ts.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(pt.typeName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      COALESCE(c.notes, '') LIKE CONCAT('%', :keyword, '%') " +
            "    ) " +
            ") " +
            "ORDER BY c.updatedAt DESC")
    Page<Contract> findByStatusAndKeyword(ContractStatus status, String keyword, Pageable pageable);

    // === 2. SERVICE STAFF ===
    @Query("SELECT DISTINCT c FROM Contract c " +
            "LEFT JOIN c.customer cu " +
            "LEFT JOIN c.address addr " +
            "LEFT JOIN c.contractUsageDetails cud " +
            "LEFT JOIN cud.priceType pt " +
            "LEFT JOIN c.serviceStaff ss " +
            "LEFT JOIN c.technicalStaff ts " +
            "LEFT JOIN c.readingRoute r " +
            "LEFT JOIN r.serviceStaffs rss " +
            "WHERE (:status IS NULL OR c.contractStatus = :status) " +

            // --- THỎA MÃN CẢ TUYẾN ĐƯỢC GIAO VÀ ID NHÂN VIÊN ---
            "AND (ss.id = :staffId AND rss.id = :staffId) " +
            // ----------------------------------------

            "AND ( " +
            "    :keyword IS NULL OR ( " +
            "      LOWER(COALESCE(c.contractNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(c.contactPhone, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      COALESCE(c.notes, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.address, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.street, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      LOWER(COALESCE(ss.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(ts.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(pt.typeName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "    ) " +
            ") " +
            "ORDER BY c.updatedAt DESC")
    Page<Contract> findByServiceStaffAndStatusAndKeyword(Integer staffId, ContractStatus status, String keyword, Pageable pageable);

    List<Contract> findByContractStatusAndEndDateBefore(ContractStatus status, LocalDate date);

    boolean existsByContractNumber(String contractNumber);

    // === 3. TAB ACTIVE (CHO STAFF) ===
    @Query("SELECT DISTINCT c FROM Contract c " +
            "LEFT JOIN c.customer cu " +
            "LEFT JOIN c.address addr " +
            "LEFT JOIN c.contractUsageDetails cud " +
            "LEFT JOIN cud.priceType pt " +
            "LEFT JOIN c.serviceStaff ss " +
            "LEFT JOIN c.technicalStaff ts " +
            "LEFT JOIN c.readingRoute r " +
            "LEFT JOIN r.serviceStaffs rss " +
            "WHERE c.contractStatus IN :statuses " +

            // --- THỎA MÃN CẢ TUYẾN ĐƯỢC GIAO VÀ ID NHÂN VIÊN ---
            "AND (ss.id = :staffId AND rss.id = :staffId) " +
            // ----------------------------------------

            "AND ( " +
            "    :keyword IS NULL OR ( " +
            "      LOWER(COALESCE(c.contractNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(c.contactPhone, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      COALESCE(c.notes, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.address, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.street, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      LOWER(COALESCE(ss.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(ts.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(pt.typeName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "    ) " +
            ") " +
            "ORDER BY c.updatedAt DESC")
    Page<Contract> findByServiceStaffAndStatusInAndKeyword(
            @Param("staffId") Integer staffId,
            @Param("statuses") List<ContractStatus> statuses,
            @Param("keyword") String keyword,
            Pageable pageable);

    // === 4. TAB ACTIVE (ADMIN) ===
    @Query("SELECT DISTINCT c FROM Contract c " +
            "LEFT JOIN c.customer cu " +
            "LEFT JOIN c.address addr " +
            "LEFT JOIN c.contractUsageDetails cud " +
            "LEFT JOIN cud.priceType pt " +
            "LEFT JOIN c.serviceStaff ss " +
            "LEFT JOIN c.technicalStaff ts " +
            "WHERE c.contractStatus IN :statuses " +
            "AND ( " +
            "    :keyword IS NULL OR ( " +
            "      LOWER(COALESCE(c.contractNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(cu.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(c.contactPhone, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      COALESCE(c.notes, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.address, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      COALESCE(addr.street, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "      LOWER(COALESCE(ss.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(ts.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "      LOWER(COALESCE(pt.typeName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "    ) " +
            ") " +
            "ORDER BY c.updatedAt DESC")
    Page<Contract> findByStatusInAndKeyword(
            @Param("statuses") List<ContractStatus> statuses,
            @Param("keyword") String keyword,
            Pageable pageable);
}