package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.entity.Contract;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ContractMapper {

    // Chuyển Entity -> DTO
    public ContractDetailsDTO toDto(Contract contract) {
        if (contract == null) return null;

        ContractDetailsDTO dto = new ContractDetailsDTO();
        dto.setId(contract.getId());
        dto.setContractNumber(contract.getContractNumber());
        dto.setContractStatus(contract.getContractStatus());
        dto.setApplicationDate(contract.getApplicationDate());

        // Xử lý Customer (tránh NullPointerException)
        if (contract.getCustomer() != null) {
            dto.setCustomerId(contract.getCustomer().getId());
            dto.setCustomerName(contract.getCustomer().getCustomerName()); // Giả định field là getFullName()
            dto.setCustomerAddress(contract.getCustomer().getAddress()); // Giả định field là getAddress()
        }

        // Xử lý Technical Staff (tránh NullPointerException)
        if (contract.getTechnicalStaff() != null) {
            dto.setTechnicalStaffId(contract.getTechnicalStaff().getId());
            dto.setTechnicalStaffName(contract.getTechnicalStaff().getFullName()); // Giả định
        }

        // Thông tin khảo sát
        dto.setSurveyDate(contract.getSurveyDate());
        dto.setTechnicalDesign(contract.getTechnicalDesign());
        dto.setEstimatedCost(contract.getEstimatedCost());

        return dto;
    }

    // Chuyển List<Entity> -> List<DTO>
    public List<ContractDetailsDTO> toDtoList(List<Contract> contracts) {
        return contracts.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Cập nhật Entity từ SurveyReport DTO
    public void updateContractFromSurveyDTO(Contract contract, SurveyReportRequestDTO dto) {
        if (contract == null || dto == null) return;

        contract.setSurveyDate(dto.getSurveyDate());
        contract.setTechnicalDesign(dto.getTechnicalDesign());
        contract.setEstimatedCost(dto.getEstimatedCost());
    }
}