package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContractAnnulTransferRequestRepository extends JpaRepository<ContractAnnulTransferRequest, Integer>,
        JpaSpecificationExecutor<ContractAnnulTransferRequest> {

    Optional<ContractAnnulTransferRequest> findByRequestNumber(String requestNumber);

    boolean existsByRequestNumber(String requestNumber);

    boolean existsByContractIdAndRequestTypeAndApprovalStatus(Integer contractId, String requestType, String approvalStatus);

    @EntityGraph(attributePaths = {"contract", "requestedBy", "approvedBy"})
    Optional<ContractAnnulTransferRequest> findWithRelationsById(Integer id);
}
