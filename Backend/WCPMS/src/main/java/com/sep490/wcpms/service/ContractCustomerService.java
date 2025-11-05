package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractCreateDTO;
import com.sep490.wcpms.dto.ContractDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.exception.DuplicateResourceException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractCustomerService {
    private final ContractRepository contractRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;

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

    public List<ContractDTO> getContractsByCustomerId(Integer accountId) {
        // Kiểm tra customer có tồn tại không
        if (!accountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Account not found with id: " + accountId);
        }

        Optional<Customer> customer = customerRepository.findByAccount_Id(accountId);
        if (!customer.isPresent()) {
            throw new ResourceNotFoundException("Customer not found with id: " + accountId);
        }

        Integer customerId = customer.get().getId();

        // Tìm tất cả contracts của customer
        List<Contract> contracts = contractRepository.findByCustomer_IdOrderByIdDesc(customerId);

        // Convert sang DTO
        return contracts.stream()
                .map(this::convertToDTO) // hoặc sử dụng mapper của bạn
                .collect(Collectors.toList());
    }

    public List<ContractDTO> getContractByCustomerIdAndStatus(Integer accountId, Contract.ContractStatus status) {
        // Kiểm tra customer có tồn tại không
        if (!accountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Account not found with id: " + accountId);
        }

        Optional<Customer> customer = customerRepository.findByAccount_Id(accountId);
        if (!customer.isPresent()) {
            throw new ResourceNotFoundException("Customer not found with id: " + accountId);
        }

        Integer customerId = customer.get().getId();

        List<Contract> contracts = contractRepository.findByCustomerIdAndContractStatus(customerId, status);
        return contracts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ContractDTO confirmCustomerSign(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        if (contract.getContractStatus() != Contract.ContractStatus.PENDING_CUSTOMER_SIGN) {
            throw new IllegalStateException("Only PENDING_CUSTOMER_SIGN contracts can be confirmed.");
        }

        contract.setContractStatus(Contract.ContractStatus.PENDING_SIGN);
        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Transactional
    public ContractDTO createContract(ContractCreateDTO createDTO) {
        // Check if contract number already exists
        if (contractRepository.existsByContractNumber(createDTO.getContractNumber())) {
            throw new DuplicateResourceException("Contract number already exists: " + createDTO.getContractNumber());
        }

        Contract contract = new Contract();
        BeanUtils.copyProperties(createDTO, contract, "customerId", "serviceStaffId", "technicalStaffId");

        // --- Map relations ---
        Customer customer = customerRepository.findById(createDTO.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Account serviceStaff = accountRepository.findById(createDTO.getServiceStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Service staff not found"));

        Account technicalStaff = accountRepository.findById(createDTO.getTechnicalStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Technical staff not found"));

        contract.setCustomer(customer);
        contract.setServiceStaff(serviceStaff);
        contract.setTechnicalStaff(technicalStaff);

        contract.setContractNumber("temp");

        Contract savedContract = contractRepository.save(contract);

        String contractNumber = generateContractNumber(savedContract.getId(), savedContract.getStartDate());

        if (contractRepository.existsByContractNumber(contractNumber)) {
            throw new DuplicateResourceException("Contract number already exists: " + contractNumber);
        }
        savedContract.setContractNumber(contractNumber);
        savedContract = contractRepository.save(savedContract);

        return convertToDTO(savedContract);
    }

    private String generateContractNumber(Integer contractId, LocalDate startDate) {
        String dateStr = startDate.format(DateTimeFormatter.ISO_LOCAL_DATE); // yyyy-MM-dd
        return contractId + "_" + dateStr;
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
            statusField.set(contract, Contract.ContractStatus.TERMINATED);
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