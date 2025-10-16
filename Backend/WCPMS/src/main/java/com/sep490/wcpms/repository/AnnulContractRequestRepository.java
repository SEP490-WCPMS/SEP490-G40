package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.AnnulContractRequest;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AnnulContractRequestRepository extends JpaRepository<AnnulContractRequest, Integer>,
        JpaSpecificationExecutor<AnnulContractRequest> {

    Optional<AnnulContractRequest> findByRequestNumber(String requestNumber);

    boolean existsByRequestNumber(String requestNumber);

    @EntityGraph(attributePaths = {"contract", "requestedBy", "approvedBy"})
    Optional<AnnulContractRequest> findWithRelationsById(Integer id);
}
