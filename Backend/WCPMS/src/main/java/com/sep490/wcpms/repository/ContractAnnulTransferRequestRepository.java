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

    // Ensure contract.customer is fetched as well so DTO fallback can read contract.getCustomer().getCustomerName() safely
    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer"})
    Optional<ContractAnnulTransferRequest> findWithRelationsById(Integer id);

    // 1. Admin/General: Tìm theo Type + List Status + Keyword
    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer", "serviceStaff"})
    @Query("SELECT r FROM ContractAnnulTransferRequest r " +
            "WHERE ((:approvalStatuses) IS NULL OR r.approvalStatus IN (:approvalStatuses)) " +
            "AND r.requestType = :requestType " +
            "AND (:keyword IS NULL OR " +
            "   LOWER(r.contract.contractNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(r.fromCustomer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(r.toCustomer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            ") " +
            "ORDER BY r.updatedAt DESC")
    Page<ContractAnnulTransferRequest> findByApprovalStatusInAndTypeAndKeyword(
            @Param("approvalStatuses") List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatuses,
            @Param("requestType") ContractAnnulTransferRequest.RequestType requestType,
            @Param("keyword") String keyword,
            Pageable pageable);

    // 2. Service Staff: Tìm theo Staff (NGƯỜI ĐƯỢC GÁN) + Type + List Status + Keyword
    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer", "serviceStaff"})
    @Query("SELECT r FROM ContractAnnulTransferRequest r " +
            "WHERE ((:approvalStatuses) IS NULL OR r.approvalStatus IN (:approvalStatuses)) " +
            // --- SỬA Ở ĐÂY: Lọc theo người được phân công xử lý yêu cầu (r.serviceStaff) ---
            "AND r.serviceStaff.id = :serviceStaffId " +
            // -------------------------------------------------------------------------------
            "AND r.requestType = :requestType " +
            "AND (:keyword IS NULL OR " +
            "   LOWER(r.contract.contractNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(r.fromCustomer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(r.toCustomer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            ") " +
            "ORDER BY r.updatedAt DESC")
    Page<ContractAnnulTransferRequest> findByStaffAndStatusInAndTypeAndKeyword(
            @Param("serviceStaffId") Integer serviceStaffId,
            @Param("approvalStatuses") List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatuses,
            @Param("requestType") ContractAnnulTransferRequest.RequestType requestType,
            @Param("keyword") String keyword,
            Pageable pageable);
}