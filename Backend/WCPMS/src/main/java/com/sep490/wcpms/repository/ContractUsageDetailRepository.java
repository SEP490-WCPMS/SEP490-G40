package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ContractUsageDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContractUsageDetailRepository extends JpaRepository<ContractUsageDetail, Integer> {
    /**
     * Tìm chi tiết sử dụng nước của một hợp đồng
     */
    Optional<ContractUsageDetail> findByContract_Id(Integer contractId);
}