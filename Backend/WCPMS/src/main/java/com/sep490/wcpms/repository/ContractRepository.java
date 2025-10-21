package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import com.sep490.wcpms.entity.Account;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Integer> {
    Optional<Contract> findByContractNumber(String contractNumber);

    boolean existsByContractNumber(String contractNumber);

    /**
     * Tìm danh sách hợp đồng/yêu cầu được gán cho một Kỹ thuật viên
     * với một trạng thái cụ thể.
     */
    List<Contract> findByTechnicalStaffAndContractStatus(Account technicalStaff, Contract.ContractStatus contractStatus);

    /**
     * Tìm tất cả các hợp đồng của một khách hàng dựa trên Account ID của họ,
     * sắp xếp theo ID giảm dần (để lấy yêu cầu mới nhất lên đầu).
     */
    List<Contract> findByCustomer_Account_IdOrderByIdDesc(Integer accountId);
}