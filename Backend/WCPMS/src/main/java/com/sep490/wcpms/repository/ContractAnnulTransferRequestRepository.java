package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractAnnulTransferRequestRepository extends JpaRepository<ContractAnnulTransferRequest, Integer>,
        JpaSpecificationExecutor<ContractAnnulTransferRequest> {

    Optional<ContractAnnulTransferRequest> findByRequestNumber(String requestNumber);

    boolean existsByRequestNumber(String requestNumber);

    boolean existsByContractIdAndRequestTypeAndApprovalStatus(Integer contractId, ContractAnnulTransferRequest.RequestType requestType,
                                                              ContractAnnulTransferRequest.ApprovalStatus approvalStatus);

    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer"})
    Optional<ContractAnnulTransferRequest> findWithRelationsById(Integer id);

    // 1. Admin/General: Tìm theo Type + List Status + Keyword
    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer", "serviceStaff"})
    @Query("SELECT r FROM ContractAnnulTransferRequest r " +
            "LEFT JOIN r.contract c " +
            "LEFT JOIN c.customer cust " +
            "WHERE ((:approvalStatuses) IS NULL OR r.approvalStatus IN (:approvalStatuses)) " +
            "AND r.requestType = :requestType " +
            "AND (:keyword IS NULL OR " +
            "   LOWER(c.contractNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(cust.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   (r.fromCustomer IS NOT NULL AND LOWER(r.fromCustomer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "   (r.toCustomer IS NOT NULL AND LOWER(r.toCustomer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            ") " +
            "ORDER BY r.updatedAt DESC")
    Page<ContractAnnulTransferRequest> findByApprovalStatusInAndTypeAndKeyword(
            @Param("approvalStatuses") List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatuses,
            @Param("requestType") ContractAnnulTransferRequest.RequestType requestType,
            @Param("keyword") String keyword,
            Pageable pageable);

    // 2. Service Staff: Tìm theo Staff (NGƯỜI ĐƯỢC GÁN VÀ PHẢI THUỘC TUYẾN) + Type + List Status + Keyword
    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer", "serviceStaff"})
    @Query("SELECT DISTINCT r FROM ContractAnnulTransferRequest r " +
            "LEFT JOIN r.contract c " +
            "LEFT JOIN c.customer cust " +
            "LEFT JOIN r.serviceStaff ss " +       // (1) Staff được gán trong request

            // --- CHECK VÀO BẢNG route_service_assignments ---
            "LEFT JOIN c.readingRoute route " +    // Từ hợp đồng lấy ra Tuyến
            "LEFT JOIN route.serviceStaffs rss " + // Từ Tuyến lấy ra Staff (qua bảng trung gian assignment)
            // ------------------------------------------------------------------

            "WHERE ((:approvalStatuses) IS NULL OR r.approvalStatus IN (:approvalStatuses)) " +

            // ss.id: Là người được gán cứng trên Request (ví dụ ID 11)
            // rss.id: Là người có tên trong bảng phân công tuyến
            // Cả 2 phải trùng khớp với :serviceStaffId (ID 11)
            "AND (ss.id = :serviceStaffId AND rss.id = :serviceStaffId) " +
            // ---------------------

            "AND r.requestType = :requestType " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "   LOWER(c.contractNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(cust.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            ") " +
            "ORDER BY r.updatedAt DESC")
    Page<ContractAnnulTransferRequest> findByStaffAndStatusInAndTypeAndKeyword(
            @Param("serviceStaffId") Integer serviceStaffId,
            @Param("approvalStatuses") List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatuses,
            @Param("requestType") ContractAnnulTransferRequest.RequestType requestType,
            @Param("keyword") String keyword,
            Pageable pageable);
    // NEW: chỉ chặn khi còn request PENDING trên hợp đồng (tránh spam nhưng vẫn cho tạo lại sau khi APPROVED/REJECTED)
    boolean existsByContractIdAndApprovalStatus(Integer contractId, ContractAnnulTransferRequest.ApprovalStatus approvalStatus);
}