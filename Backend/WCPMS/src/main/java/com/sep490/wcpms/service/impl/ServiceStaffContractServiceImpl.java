package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import com.sep490.wcpms.entity.Contract.PaymentMethod;
import com.sep490.wcpms.repository.ServiceStaffContractRepository;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ServiceStaffContractServiceImpl implements ServiceStaffContractService {

    private final ServiceStaffContractRepository contractRepository;
    private final AccountRepository accountRepository; // optional, used if you assign serviceStaff or technicalStaff

    @Override
    public Page<ServiceStaffContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable) {
        ContractStatus contractStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                contractStatus = ContractStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid contract status: " + status);
            }
        }

        return contractRepository.findByStatusAndKeyword(contractStatus, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public ServiceStaffContractDTO updateContractByServiceStaff(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Update only allowed fields (null-safe)
        if (updateRequest.getStartDate() != null) {
            contract.setStartDate(updateRequest.getStartDate());
        }
        if (updateRequest.getEndDate() != null) {
            contract.setEndDate(updateRequest.getEndDate());
        }
        if (updateRequest.getNotes() != null) {
            contract.setNotes(updateRequest.getNotes());
        }
        if (updateRequest.getEstimatedCost() != null) {
            contract.setEstimatedCost(updateRequest.getEstimatedCost());
        }
        if (updateRequest.getContractValue() != null) {
            contract.setContractValue(updateRequest.getContractValue());
        }
        if (updateRequest.getPaymentMethod() != null && !updateRequest.getPaymentMethod().isBlank()) {
            try {
                PaymentMethod pm = PaymentMethod.valueOf(updateRequest.getPaymentMethod().toUpperCase());
                contract.setPaymentMethod(pm);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid payment method: " + updateRequest.getPaymentMethod());
            }
        }
        // If service staff id provided and exists, set (optional)
        if (updateRequest.getServiceStaffId() != null) {
            Account staff = accountRepository.findById(updateRequest.getServiceStaffId())
                    .orElseThrow(() -> new RuntimeException("Service staff not found"));
            contract.setServiceStaff(staff);
        }

        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    public ServiceStaffContractDTO getContractDetailById(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));
        return convertToDTO(contract);
    }

    @Override
    public Page<ServiceStaffContractDTO> getDraftContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.DRAFT, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public ServiceStaffContractDTO submitContractForSurvey(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép chuyển từ DRAFT sang PENDING
        if (contract.getContractStatus() != ContractStatus.DRAFT) {
            throw new RuntimeException("Cannot submit non-DRAFT contract. Current status: " + contract.getContractStatus());
        }

        contract.setContractStatus(ContractStatus.PENDING);
        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    public Page<ServiceStaffContractDTO> getPendingSurveyReviewContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.PENDING_SURVEY_REVIEW, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public ServiceStaffContractDTO approveSurveyReport(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép duyệt hợp đồng có status PENDING_SURVEY_REVIEW
        if (contract.getContractStatus() != ContractStatus.PENDING_SURVEY_REVIEW) {
            throw new RuntimeException("Cannot approve contract not in PENDING_SURVEY_REVIEW status. Current status: " + contract.getContractStatus());
        }

        contract.setContractStatus(ContractStatus.APPROVED);
        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    public Page<ServiceStaffContractDTO> getApprovedContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.APPROVED, keyword, pageable)
                .map(this::convertToDTO);
    }

    private ServiceStaffContractDTO convertToDTO(Contract c) {
        ServiceStaffContractDTO dto = new ServiceStaffContractDTO();
        dto.setId(c.getId());
        dto.setContractNumber(c.getContractNumber());
        dto.setContractStatus(c.getContractStatus() != null ? c.getContractStatus().name() : null);
        dto.setStartDate(c.getStartDate());
        dto.setEndDate(c.getEndDate());
        dto.setEstimatedCost(c.getEstimatedCost());
        dto.setContractValue(c.getContractValue());
        dto.setNotes(c.getNotes());
        if (c.getCustomer() != null) {
            dto.setCustomerId(c.getCustomer().getId());
            dto.setCustomerName(c.getCustomer().getCustomerName());
            dto.setCustomerCode(c.getCustomer().getCustomerCode());
        }
        if (c.getServiceStaff() != null) {
            dto.setServiceStaffId(c.getServiceStaff().getId());
            dto.setServiceStaffName(c.getServiceStaff().getFullName());
        }
        if (c.getTechnicalStaff() != null) {
            dto.setTechnicalStaffId(c.getTechnicalStaff().getId());
            dto.setTechnicalStaffName(c.getTechnicalStaff().getFullName());
        }
        dto.setSurveyDate(c.getSurveyDate());
        dto.setTechnicalDesign(c.getTechnicalDesign());
        return dto;
    }
}
