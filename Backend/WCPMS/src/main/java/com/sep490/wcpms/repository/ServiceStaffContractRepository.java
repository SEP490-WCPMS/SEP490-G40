package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceStaffContractRepository extends JpaRepository<Contract, Integer> {

    @Query("SELECT c FROM Contract c JOIN c.customer cu WHERE " +
            "(:status IS NULL OR c.contractStatus = :status) AND " +
            "(:keyword IS NULL OR cu.customerName LIKE %:keyword% OR cu.customerCode LIKE %:keyword%)")
    Page<Contract> findByStatusAndKeyword(String status, String keyword, Pageable pageable);

}
