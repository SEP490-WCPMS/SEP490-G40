package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.contract.ContractDTO;
import com.sep490.wcpms.dto.contract.UpdateContractRequestDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class ContractServiceImpl implements ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Override
    public Page<ContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable) {
        Page<Contract> contractPage = contractRepository.findByStatusAndKeyword(status, keyword, pageable);
        return contractPage.map(this::convertToDto);
    }

    @Override
    public ContractDTO updateContractByServiceStaff(Long contractId, UpdateContractRequestDTO updateRequest) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hợp đồng với ID: " + contractId));

        // SỬA LỖI 1: Chuyển đổi String từ DTO thành Enum cho Entity
        if (updateRequest.getContractStatus() != null && !updateRequest.getContractStatus().isEmpty()) {
            Contract.ContractStatus statusEnum = Contract.ContractStatus.valueOf(updateRequest.getContractStatus().toLowerCase());
            contract.setContractStatus(statusEnum);
        }

        contract.setSurveyDate(updateRequest.getSurveyDate());
        contract.setInstallationDate(updateRequest.getInstallationDate());
        contract.setNotes(updateRequest.getNotes());

        Contract updatedContract = contractRepository.save(contract);
        return convertToDto(updatedContract);
    }

    @Override
    public ContractDTO getContractDetailById(Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hợp đồng với ID: " + contractId));
        return convertToDto(contract);
    }

    private ContractDTO convertToDto(Contract contract) {
        ContractDTO dto = new ContractDTO();
        dto.setId(contract.getId());
        dto.setContractNumber(contract.getContractNumber());

        // SỬA LỖI 2: Chuyển đổi Enum từ Entity thành String cho DTO
        if (contract.getContractStatus() != null) {
            dto.setContractStatus(contract.getContractStatus().name());
        }

        dto.setStartDate(contract.getStartDate());
        dto.setApplicationDate(contract.getApplicationDate());
        dto.setSurveyDate(contract.getSurveyDate());
        dto.setInstallationDate(contract.getInstallationDate());
        dto.setNotes(contract.getNotes());

        if (contract.getCustomer() != null) {
            dto.setCustomerCode(contract.getCustomer().getCustomerCode());
            dto.setCustomerName(contract.getCustomer().getCustomerName());
            dto.setAddress(contract.getCustomer().getAddress());
        }

        // Thêm thông tin nhân viên (nếu cần)
        if (contract.getServiceStaff() != null) {
            dto.setServiceStaffName(contract.getServiceStaff().getFullName());
        }
        if (contract.getTechnicalStaff() != null) {
            dto.setTechnicalStaffName(contract.getTechnicalStaff().getFullName());
        }

        return dto;
    }
}