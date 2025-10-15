package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractCreateDTO;
import com.sep490.wcpms.dto.contract.ContractDTO;
import com.sep490.wcpms.dto.contract.UpdateContractRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ContractService {

    //(CHO STAFF) ---
    Page<ContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable);
    ContractDTO updateContractByServiceStaff(Long contractId, UpdateContractRequestDTO updateRequest);
    ContractDTO getContractDetailById(Long contractId);

    //(CHO CUSTOMER) ---
    List<ContractDTO> getAllContracts();
    ContractDTO getContractById(Long id);
    ContractDTO createContract(ContractCreateDTO createDTO);
    ContractDTO updateContract(Long id, ContractCreateDTO updateDTO);
    void deleteContract(Long id);
}