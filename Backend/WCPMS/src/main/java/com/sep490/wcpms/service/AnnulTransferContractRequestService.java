package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractRequestMapper;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.util.Constant;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AnnulTransferContractRequestService {

    private final AnnulTransferContractRequestRepository repository;
    private final ContractRepository contractRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository; // cần nếu validate from/to
    private final ContractRequestMapper mapper;

    // CREATE (annul/transfer)
    @Transactional
    public ContractRequestDTO create(ContractRequestCreateDTO dto) {

        String type = dto.getRequestType();
        if (type == null || (!type.equalsIgnoreCase("annul") && !type.equalsIgnoreCase("transfer"))) {
            throw new IllegalArgumentException("requestType must be 'annul' or 'transfer'.");
        }

        if (repository.existsByRequestNumber(dto.getRequestNumber())) {
            throw new DuplicateKeyException("Request number already exists: " + dto.getRequestNumber());
        }

        Contract contract = contractRepository.findById(dto.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + dto.getContractId()));

        Account requestedBy = accountRepository.findById(dto.getRequestedById())
                .orElseThrow(() -> new ResourceNotFoundException("Account (requestedById) not found: " + dto.getRequestedById()));

        // Không cho 2 request PENDING cùng loại trên 1 contract
        if (repository.existsByContractIdAndRequestTypeAndApprovalStatus(
                contract.getId(), type.toLowerCase(), Constant.ApprovalStatus.PENDING)) {
            throw new IllegalStateException("A pending request of the same type already exists for this contract.");
        }

        Customer fromCustomer = null, toCustomer = null;
        if (type.equalsIgnoreCase("transfer")) {
            if (dto.getFromCustomerId() == null || dto.getToCustomerId() == null) {
                throw new IllegalArgumentException("fromCustomerId and toCustomerId are required for transfer.");
            }
            fromCustomer = customerRepository.findById(dto.getFromCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("From-customer not found: " + dto.getFromCustomerId()));
            toCustomer = customerRepository.findById(dto.getToCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("To-customer not found: " + dto.getToCustomerId()));
        }

        AnnulTransferContractRequest entity =
                mapper.toEntity(dto, contract, requestedBy, fromCustomer, toCustomer);

        // đảm bảo default
        entity.setRequestType(type.toLowerCase());
        if (entity.getApprovalStatus() == null) {
            entity.setApprovalStatus(Constant.ApprovalStatus.PENDING);
        }

        entity = repository.save(entity);
        return mapper.toDTO(entity);
    }

    public ContractRequestDTO getById(Integer id) {
        AnnulTransferContractRequest entity = repository.findWithRelationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));
        return mapper.toDTO(entity);
    }

    public Page<ContractRequestDTO> search(Integer contractId,
                                           String requestType,
                                           String status,
                                           LocalDate from,
                                           LocalDate to,
                                           String q,
                                           Pageable pageable) {
        Specification<AnnulTransferContractRequest> spec = Specification.allOf(
                AnnulTransferContractRequestSpecs.contractIdEq(contractId),
                AnnulTransferContractRequestSpecs.typeEq(requestType),
                AnnulTransferContractRequestSpecs.statusEq(status),
                AnnulTransferContractRequestSpecs.requestDateGte(from),
                AnnulTransferContractRequestSpecs.requestDateLte(to),
                AnnulTransferContractRequestSpecs.qLike(q)
        );

        return repository.findAll(spec, pageable).map(mapper::toDTO);
    }

    @Transactional
    public ContractRequestDTO updateApproval(Integer id, ContractRequestUpdateDTO dto) {
        AnnulTransferContractRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));

        if (!Objects.equals(entity.getApprovalStatus(), Constant.ApprovalStatus.PENDING)) {
            throw new IllegalStateException("Only PENDING requests can be approved/rejected.");
        }

        String current = String.valueOf(entity.getContract().getContractStatus());
        if (Constant.ContractStatus.TERMINATED.equalsIgnoreCase(current)
                || Constant.ContractStatus.EXPIRED.equalsIgnoreCase(current)) {
            throw new IllegalStateException("Contract is already in a final state: " + current);
        }

        Account approvedBy = null;
        if (dto.getApprovedById() != null) {
            approvedBy = accountRepository.findById(dto.getApprovedById())
                    .orElseThrow(() -> new ResourceNotFoundException("Approver account not found: " + dto.getApprovedById()));
        }

        if (Constant.ApprovalStatus.APPROVED.equalsIgnoreCase(dto.getApprovalStatus())
                || Constant.ApprovalStatus.REJECTED.equalsIgnoreCase(dto.getApprovalStatus())) {
            if (approvedBy == null) {
                throw new IllegalArgumentException("approvedById is required when approving/rejecting.");
            }
            if (dto.getApprovalDate() == null) {
                dto.setApprovalDate(LocalDate.now());
            }
        }

        mapper.updateApproval(entity, dto, approvedBy);

        // Hệ quả khi APPROVED
        if (Constant.ApprovalStatus.APPROVED.equalsIgnoreCase(dto.getApprovalStatus())) {
            Contract contract = entity.getContract();

            if ("annul".equalsIgnoreCase(entity.getRequestType())) {
                contract.setContractStatus(Contract.ContractStatus.valueOf(Constant.ContractStatus.TERMINATED));
                if (contract.getEndDate() == null) {
                    contract.setEndDate(LocalDate.now());
                }
                contractRepository.save(contract);
            }

            if ("transfer".equalsIgnoreCase(entity.getRequestType())) {
                if (entity.getToCustomer() == null) {
                    throw new IllegalStateException("toCustomer is required for transfer approval.");
                }
                // cần Contract có field 'customer'
                contract.setCustomer(entity.getToCustomer());
                contractRepository.save(contract);
            }
        }

        return mapper.toDTO(entity);
    }

    @Transactional
    public ContractRequestDTO updateMinor(Integer id, ContractRequestUpdateDTO dto) {
        AnnulTransferContractRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));

        if (dto.getAttachedEvidence() != null) entity.setAttachedEvidence(dto.getAttachedEvidence());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());

        return mapper.toDTO(entity);
    }

    @Transactional
    public void delete(Integer id) {
        AnnulTransferContractRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));
        repository.delete(entity);
    }
}
