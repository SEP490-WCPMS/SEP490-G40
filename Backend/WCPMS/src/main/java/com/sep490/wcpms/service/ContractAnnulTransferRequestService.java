package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractAnnulTransferRequestMapper;
import com.sep490.wcpms.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractAnnulTransferRequestService {

    private final ContractAnnulTransferRequestRepository repository;
    private final ContractRepository contractRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository; // cần nếu validate from/to
    private final ContractAnnulTransferRequestMapper mapper;

    // CREATE (annul/transfer)
    @Transactional
    public ContractAnnulTransferRequestDTO create(ContractAnnulTransferRequestCreateDTO dto) {

        log.info("[REQUEST CREATE] incoming create DTO: {}", dto);

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

        // VALIDATE HỢP ĐỒNG ĐANG ACTIVE TẠO YÊU CẦU HỦY/CHUYỂN
        if (contract.getContractStatus() != Contract.ContractStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Chỉ những hợp đồng đang ở trạng thái ACTIVE mới được tạo yêu cầu hủy/chuyển."
            );
        }

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
            Integer accoundId = dto.getRequestedById();
            Optional<Customer> customer = customerRepository.findByAccount_Id(accoundId);
            if (!customer.isPresent()) {
                throw new ResourceNotFoundException("Customer not found with id: " + accoundId);
            }

            fromCustomer = customer.get();

            toCustomer = customerRepository.findById(dto.getToCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("To-customer not found: " + dto.getToCustomerId()));
        }

        ContractAnnulTransferRequest entity;
        try {
            entity = mapper.toEntity(dto, contract, requestedBy, fromCustomer, toCustomer);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] failed to map CreateDTO -> Entity. dto={}, contractId={}, requestedById={}, fromCustomerId={}, toCustomerId={}",
                    dto, dto.getContractId(), dto.getRequestedById(), dto.getFromCustomerId(), dto.getToCustomerId(), ex);
            throw ex;
        }

// đảm bảo default
        entity.setRequestType(ContractAnnulTransferRequest.RequestType.valueOf(type.toUpperCase()));
        if (entity.getApprovalStatus() == null) {
            entity.setApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus.PENDING);
        }

        entity = repository.save(entity);

        try {
            // Use service-level converter which includes fallback to contract.customer when fromCustomer is null
            ContractAnnulTransferRequestDTO out = convertToAnnulTransferDTO(entity);
             log.info("[REQUEST CREATED] id={}, contractId={}, type={}, requestedById={}", out.getId(), out.getContractId(), out.getRequestType(), out.getRequestedById());
             return out;
         } catch (Exception ex) {
             log.error("[MAPPER ERROR] failed to map Entity -> DTO after save. entityId={}", entity != null ? entity.getId() : null, ex);
             throw ex;
         }
     }

     public ContractAnnulTransferRequestDTO getById(Integer id) {
        ContractAnnulTransferRequest entity = repository.findWithRelationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));
        try {
            return convertToAnnulTransferDTO(entity);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] toDTO failed for entity id={}", id, ex);
            throw ex;
        }
     }

    @Transactional
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

        // Use service-level converter so we apply fallback logic (e.g. use contract.customer when fromCustomer is null)
        return repository.findAll(spec, pageable).map(entity -> {
            try {
                return convertToAnnulTransferDTO(entity);
            } catch (Exception ex) {
                log.error("[MAPPER ERROR] convertToAnnulTransferDTO failed during search mapping. entityId={}", entity != null ? entity.getId() : null, ex);
                throw new RuntimeException("Failed to map ContractAnnulTransferRequest entity to DTO", ex);
            }
        });
    }

    @Transactional
    public ContractAnnulTransferRequestDTO updateApproval(Integer id, ContractAnnulTransferRequestUpdateDTO dto) {
        log.info("[UPDATE APPROVAL] id={}, dto.approvalStatus={}, dto.approvedById={}", id, dto.getApprovalStatus(), dto.getApprovedById());
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

        // --- NEW: Khi từ chối, yêu cầu có lý do (notes) để audit ---
        if (dto.getApprovalStatus() == ContractAnnulTransferRequest.ApprovalStatus.REJECTED) {
            if (dto.getNotes() == null || dto.getNotes().trim().isEmpty()) {
                throw new IllegalArgumentException("notes (reason) is required when rejecting a request.");
            }
        }

        try {
            mapper.updateApproval(entity, dto, approvedBy);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] updateApproval failed for id={}. dto={}", id, dto, ex);
            throw ex;
        }

        // Hệ quả khi APPROVED
        if (ContractAnnulTransferRequest.ApprovalStatus.APPROVED.equals(dto.getApprovalStatus())) {
            Contract contract = entity.getContract();

            if (entity.getRequestType() == ContractAnnulTransferRequest.RequestType.ANNUL) {
                contract.setContractStatus(Contract.ContractStatus.TERMINATED);
                if (contract.getEndDate() == null) {
                    contract.setEndDate(LocalDate.now());
                }
                contractRepository.save(contract);
                log.info("[APPROVAL] Annul approved - contract {} terminated", contract.getId());
            }

            if (entity.getRequestType() == ContractAnnulTransferRequest.RequestType.TRANSFER) {
                if (entity.getToCustomer() == null) {
                    throw new IllegalStateException("toCustomer is required for transfer approval.");
                }
                contract.setCustomer(entity.getToCustomer());
                contractRepository.save(contract);
                log.info("[APPROVAL] Transfer approved - contract {} customer updated to {}", contract.getId(), entity.getToCustomer().getId());
            }

        }

        entity = repository.save(entity);

        try {
            // Use converter with fallback for customer names
            return convertToAnnulTransferDTO(entity);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] toDTO failed after approval save for id={}", entity != null ? entity.getId() : null, ex);
            throw ex;
        }
    }

    @Transactional
    public ContractAnnulTransferRequestDTO updateMinor(Integer id, ContractAnnulTransferRequestUpdateDTO dto) {
        ContractAnnulTransferRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));

        if (dto.getAttachedEvidence() != null) entity.setAttachedEvidence(dto.getAttachedEvidence());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());

        try {
            return convertToAnnulTransferDTO(entity);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] toDTO failed in updateMinor for id={}", id, ex);
            throw ex;
        }
    }

    @Transactional
    public void delete(Integer id) {
        ContractAnnulTransferRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract request not found: " + id));
        repository.delete(entity);
        log.info("[DELETE] Contract annul/transfer request deleted: id={}", id);
    }

    public ContractAnnulTransferRequestDTO convertToAnnulTransferDTO(ContractAnnulTransferRequest request) {
        ContractAnnulTransferRequestDTO dto = new ContractAnnulTransferRequestDTO();
        dto.setId(request.getId());
        // map request and contract identifiers
        dto.setRequestNumber(request.getRequestNumber());
        dto.setContractId(request.getContract() != null ? request.getContract().getId() : null);
        dto.setContractNumber(request.getContract() != null ? request.getContract().getContractNumber() : null);
        dto.setRequestType(request.getRequestType() != null ? request.getRequestType().name() : null);
        dto.setApprovalStatus(request.getApprovalStatus() != null ? request.getApprovalStatus().name() : null);
        dto.setRequestedById(request.getRequestedBy() != null ? request.getRequestedBy().getId() : null);
        dto.setRequestedByUsername(request.getRequestedBy() != null ? request.getRequestedBy().getUsername() : null);
        dto.setRequestDate(request.getRequestDate());
        dto.setApprovalDate(request.getApprovalDate());
        dto.setReason(request.getReason());
        dto.setNotes(request.getNotes());
        dto.setAttachedEvidence(request.getAttachedEvidence());

        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        dto.setRejectionReason(request.getRejectionReason());

        if (request.getFromCustomer() != null) {
            dto.setFromCustomerId(request.getFromCustomer().getId());
            dto.setFromCustomerName(request.getFromCustomer().getCustomerName());
        } else {
            // Fallback: show current contract owner name when fromCustomer is not set (e.g. annul requests)
            if (request.getContract() != null && request.getContract().getCustomer() != null) {
                dto.setFromCustomerId(request.getContract().getCustomer().getId());
                dto.setFromCustomerName(request.getContract().getCustomer().getCustomerName());
            } else {
                dto.setFromCustomerName(null);
            }
        }
        if (request.getToCustomer() != null) {
            dto.setToCustomerId(request.getToCustomer().getId());
            dto.setToCustomerName(request.getToCustomer().getCustomerName());
        } else {
            dto.setToCustomerName(null);
        }
        // approvedBy info (if any)
        if (request.getApprovedBy() != null) {
            dto.setApprovedById(request.getApprovedBy().getId());
            dto.setApprovedByUsername(request.getApprovedBy().getUsername());
        }
        return dto;
    }
}
