package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ContractUsageDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractUsageDetailRepository extends JpaRepository<ContractUsageDetail, Integer> {
}