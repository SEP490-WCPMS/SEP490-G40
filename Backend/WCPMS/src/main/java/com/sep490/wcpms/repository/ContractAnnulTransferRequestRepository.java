package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

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

    Page<ContractAnnulTransferRequest> findByApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus approvalStatus, Pageable pageable);

    // Also include contract.customer here for list queries
    @EntityGraph(attributePaths = {"contract", "contract.customer", "requestedBy", "approvedBy", "fromCustomer", "toCustomer"})
    Page<ContractAnnulTransferRequest> findWithCustomersByApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus approvalStatus, Pageable pageable);
}
