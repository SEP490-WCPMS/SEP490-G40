package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceStaffContractRepository extends JpaRepository<Contract, Integer> {

    @Query("""
        SELECT c FROM Contract c 
        JOIN c.customer cu 
        WHERE (:status IS NULL OR c.contractStatus = :status)
          AND (:keyword IS NULL OR LOWER(cu.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                              OR LOWER(cu.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Contract> findByStatusAndKeyword(ContractStatus status, String keyword, Pageable pageable);
}
