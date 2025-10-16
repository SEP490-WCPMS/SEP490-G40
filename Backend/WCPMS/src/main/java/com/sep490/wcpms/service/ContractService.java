package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractCreateDTO;
import com.sep490.wcpms.dto.ContractDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.exception.DuplicateResourceException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.util.Constant;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractService {
    private final ContractRepository contractRepository;

    public List<ContractDTO> getAllContracts() {
        return contractRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ContractDTO getContractById(Integer id) {
        return contractRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
    }

    @Transactional
    public ContractDTO createContract(ContractCreateDTO createDTO) {
        // Check if contract number already exists
        if (contractRepository.existsByContractNumber(createDTO.getContractNumber())) {
            throw new DuplicateResourceException("Contract number already exists: " + createDTO.getContractNumber());
        }

        Contract contract = new Contract();
        BeanUtils.copyProperties(createDTO, contract);

        Contract savedContract = contractRepository.save(contract);
        return convertToDTO(savedContract);
    }

    @Transactional
    public ContractDTO updateContract(Integer id, ContractCreateDTO updateDTO) {
        Contract existingContract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));

        // Check if contract number is changed and already exists
        if (!existingContract.getContractNumber().equals(updateDTO.getContractNumber()) &&
                contractRepository.existsByContractNumber(updateDTO.getContractNumber())) {
            throw new DuplicateResourceException("Contract number already exists: " + updateDTO.getContractNumber());
        }

        BeanUtils.copyProperties(updateDTO, existingContract);
        existingContract.setId(id); // Ensure ID doesn't change

        Contract updatedContract = contractRepository.save(existingContract);
        return convertToDTO(updatedContract);
    }

    @Transactional
    public void deleteContract(Integer id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));

        // Using reflection to set the field directly (as a last resort)
        try {
            Field statusField = Contract.class.getDeclaredField("contractStatus");
            statusField.setAccessible(true);
            statusField.set(contract, Constant.ContractStatus.DELETED);
            contractRepository.save(contract);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update contract status", e);
        }
    }

    private ContractDTO convertToDTO(Contract contract) {
        ContractDTO dto = new ContractDTO();
        BeanUtils.copyProperties(contract, dto);
        return dto;
    }
}