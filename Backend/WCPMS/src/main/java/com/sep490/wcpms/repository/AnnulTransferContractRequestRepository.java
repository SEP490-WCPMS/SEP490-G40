package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.AnnulTransferContractRequest;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnnulTransferContractRequestRepository extends JpaRepository<AnnulTransferContractRequest, Integer>,
        JpaSpecificationExecutor<AnnulTransferContractRequest> {

    Optional<AnnulTransferContractRequest> findByRequestNumber(String requestNumber);

    boolean existsByRequestNumber(String requestNumber);

    boolean existsByContractIdAndRequestTypeAndApprovalStatus(Integer contractId, String requestType, String approvalStatus);

    @EntityGraph(attributePaths = {"contract", "requestedBy", "approvedBy"})
    Optional<AnnulTransferContractRequest> findWithRelationsById(Integer id);
}
