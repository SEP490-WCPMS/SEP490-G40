package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractAnnulTransferRequestMapper;
import com.sep490.wcpms.repository.*;
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
public class ContractAnnulTransferRequestService {

    private final ContractAnnulTransferRequestRepository repository;
    private final ContractRepository contractRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository; // cần nếu validate from/to
    private final ContractAnnulTransferRequestMapper mapper;

    // CREATE (annul/transfer)
    @Transactional
    public ContractAnnulTransferRequestDTO create(ContractAnnulTransferRequestCreateDTO dto) {

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
                contract.getId(),
                ContractAnnulTransferRequest.RequestType.valueOf(type.toUpperCase()),
                ContractAnnulTransferRequest.ApprovalStatus.PENDING)) {
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

        ContractAnnulTransferRequest entity =
                mapper.toEntity(dto, contract, requestedBy, fromCustomer, toCustomer);

// đảm bảo default
        entity.setRequestType(ContractAnnulTransferRequest.RequestType.valueOf(type.toUpperCase()));
        if (entity.getApprovalStatus() == null) {
            entity.setApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus.PENDING);
        }

        entity = repository.save(entity);
        return mapper.toDTO(entity);
    }

    public ContractAnnulTransferRequestDTO getById(Integer id) {
        ContractAnnulTransferRequest entity = repository.findWithRelationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));
        return mapper.toDTO(entity);
    }

    public Page<ContractAnnulTransferRequestDTO> search(Integer contractId,
                                                        String requestType,
                                                        String status,
                                                        LocalDate from,
                                                        LocalDate to,
                                                        String q,
                                                        Pageable pageable) {
        Specification<ContractAnnulTransferRequest> spec = Specification.allOf(
                ContractAnnulTransferRequestSpecs.contractIdEq(contractId),
                ContractAnnulTransferRequestSpecs.typeEq(requestType),
                ContractAnnulTransferRequestSpecs.statusEq(status),
                ContractAnnulTransferRequestSpecs.requestDateGte(from),
                ContractAnnulTransferRequestSpecs.requestDateLte(to),
                ContractAnnulTransferRequestSpecs.qLike(q)
        );

        return repository.findAll(spec, pageable).map(mapper::toDTO);
    }

    @Transactional
    public ContractAnnulTransferRequestDTO updateApproval(Integer id, ContractAnnulTransferRequestUpdateDTO dto) {
        ContractAnnulTransferRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));

        if (!Objects.equals(entity.getApprovalStatus(), ContractAnnulTransferRequest.ApprovalStatus.PENDING)) {
            throw new IllegalStateException("Only PENDING requests can be approved/rejected.");
        }

        Contract.ContractStatus current = entity.getContract().getContractStatus();
        if (current == Contract.ContractStatus.TERMINATED
                || current == Contract.ContractStatus.EXPIRED) {
            throw new IllegalStateException("Contract is already in a final state: " + current);
        }

        Account approvedBy = null;
        if (dto.getApprovedById() != null) {
            approvedBy = accountRepository.findById(dto.getApprovedById())
                    .orElseThrow(() -> new ResourceNotFoundException("Approver account not found: " + dto.getApprovedById()));
        }

        if (dto.getApprovalStatus() == ContractAnnulTransferRequest.ApprovalStatus.APPROVED
                || dto.getApprovalStatus() == ContractAnnulTransferRequest.ApprovalStatus.REJECTED) {
            if (approvedBy == null) {
                throw new IllegalArgumentException("approvedById is required when approving/rejecting.");
            }
            if (dto.getApprovalDate() == null) {
                dto.setApprovalDate(LocalDate.now());
            }
        }

        mapper.updateApproval(entity, dto, approvedBy);

        // Hệ quả khi APPROVED
        if (ContractAnnulTransferRequest.ApprovalStatus.APPROVED.equals(dto.getApprovalStatus())) {
            Contract contract = entity.getContract();

            if (entity.getRequestType() == ContractAnnulTransferRequest.RequestType.ANNUL) {
                contract.setContractStatus(Contract.ContractStatus.TERMINATED);
                if (contract.getEndDate() == null) {
                    contract.setEndDate(LocalDate.now());
                }
                contractRepository.save(contract);
            }

            if (entity.getRequestType() == ContractAnnulTransferRequest.RequestType.TRANSFER) {
                if (entity.getToCustomer() == null) {
                    throw new IllegalStateException("toCustomer is required for transfer approval.");
                }
                contract.setCustomer(entity.getToCustomer());
                contractRepository.save(contract);
            }

        }

        return mapper.toDTO(entity);
    }

    @Transactional
    public ContractAnnulTransferRequestDTO updateMinor(Integer id, ContractAnnulTransferRequestUpdateDTO dto) {
        ContractAnnulTransferRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));

        if (dto.getAttachedEvidence() != null) entity.setAttachedEvidence(dto.getAttachedEvidence());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());

        return mapper.toDTO(entity);
    }

    @Transactional
    public void delete(Integer id) {
        ContractAnnulTransferRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));
        repository.delete(entity);
    }
}
