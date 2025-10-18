package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.repository.ServiceStaffContractRepository;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class ServiceStaffContractServiceImpl implements ServiceStaffContractService {

    private final ServiceStaffContractRepository contractRepository;

    @Override
    public Page<ServiceStaffContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(status, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public ServiceStaffContractDTO updateContractByServiceStaff(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        BeanUtils.copyProperties(updateRequest, contract);
        Contract updated = contractRepository.save(contract);

        return convertToDTO(updated);
    }

    @Override
    public ServiceStaffContractDTO getContractDetailById(Integer contractId) {
        return contractRepository.findById(contractId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));
    }

    private ServiceStaffContractDTO convertToDTO(Contract contract) {
        ServiceStaffContractDTO dto = new ServiceStaffContractDTO();
        BeanUtils.copyProperties(contract, dto);
        return dto;
    }
}
