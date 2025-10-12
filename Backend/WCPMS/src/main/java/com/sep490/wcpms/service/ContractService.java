package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.contract.ContractDTO;
import com.sep490.wcpms.dto.contract.UpdateContractRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContractService {

    Page<ContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable);

    // DÒNG NÀY RẤT QUAN TRỌNG
    // Phương thức phải có tên là "updateContractByServiceStaff"
    // và nhận vào 2 tham số: (Integer, UpdateContractRequestDTO)
    ContractDTO updateContractByServiceStaff(Long contractId, UpdateContractRequestDTO updateRequest);

    ContractDTO getContractDetailById(Long contractId);
}