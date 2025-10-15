package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.AnnulContractRequestCreateDTO;
import com.sep490.wcpms.dto.AnnulContractRequestDTO;
import com.sep490.wcpms.dto.AnnulContractRequestUpdateDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.AnnulContractRequest;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.AnnulContractRequestMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.AnnulContractRequestRepository;
import com.sep490.wcpms.repository.AnnulContractRequestSpecs;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.util.Constant;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AnnulContractRequestService {
    private final AnnulContractRequestRepository repository;
    private final ContractRepository contractRepository;
    private final AccountRepository accountRepository;
    private final AnnulContractRequestMapper mapper;

    @Transactional
    public AnnulContractRequestDTO create(AnnulContractRequestCreateDTO dto) {
        // 1) requestNumber phải unique
        if (repository.existsByRequestNumber(dto.getRequestNumber())) {
            throw new DuplicateKeyException("Annul request number already exists: " + dto.getRequestNumber());
        }

        // 2) contractId phải tồn tại
        if (!contractRepository.existsById(dto.getContractId())) {
            throw new ResourceNotFoundException("Contract not found with id: " + dto.getContractId());
        }

        // 3) requestedById phải tồn tại
        //  LƯU Ý: dùng đúng kiểu ID (Integer). Nếu Account.id là Integer thì không dùng Long.valueOf(...)
        if (!accountRepository.existsById(Long.valueOf(dto.getRequestedById()))) {
            throw new ResourceNotFoundException("Account (requestedById) not found: " + dto.getRequestedById());
        }

        // Sau khi validate, lấy reference để map (tránh query thêm)
        Contract contract = contractRepository.getReferenceById(dto.getContractId());
        Account requestedBy = accountRepository.getReferenceById(Long.valueOf(dto.getRequestedById()));

        AnnulContractRequest entity = mapper.toEntity(dto, contract, requestedBy);
        entity = repository.save(entity);
        return mapper.toDTO(entity);
    }

    public AnnulContractRequestDTO getById(Integer id) {
        AnnulContractRequest entity = repository.findWithRelationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annul request not found: " + id));
        return mapper.toDTO(entity);
    }

    public Page<AnnulContractRequestDTO> search(
            Integer contractId,
            Constant.ApprovalStatus status,
            LocalDate from,
            LocalDate to,
            String q,
            Pageable pageable) {

        Specification<AnnulContractRequest> spec = Specification.allOf(
                AnnulContractRequestSpecs.contractIdEq(contractId),
                AnnulContractRequestSpecs.statusEq(status),
                AnnulContractRequestSpecs.requestDateGte(from),
                AnnulContractRequestSpecs.requestDateLte(to),
                AnnulContractRequestSpecs.qLike(q)
        );

        Page<AnnulContractRequest> page = repository.findAll(spec, pageable);
        return page.map(mapper::toDTO);
    }


    //Todo:: thêm xử lý contract sau khi cập nhật
    @Transactional
    public AnnulContractRequestDTO updateApproval(Integer id, AnnulContractRequestUpdateDTO dto) {
        AnnulContractRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annul request not found: " + id));

        // chỉ xử lý khi đang PENDING
        if (!Objects.equals(entity.getApprovalStatus(), Constant.ApprovalStatus.PENDING)) {
            throw new IllegalStateException("Only PENDING requests can be approved/rejected.");
        }

        Account approvedBy = null;
        if (dto.getApprovedById() != null) {
            approvedBy = accountRepository.findById(Long.valueOf(dto.getApprovedById()))
                    .orElseThrow(() -> new ResourceNotFoundException("Approver account not found: " + dto.getApprovedById()));
        }

        // validate bắt buộc có approvedBy khi không phải PENDING
        if (Constant.ApprovalStatus.APPROVED.equalsIgnoreCase(dto.getApprovalStatus()) || Constant.ApprovalStatus.REJECTED.equalsIgnoreCase(dto.getApprovalStatus())) {
            if (approvedBy == null) {
                throw new IllegalArgumentException("approvedById is required when approving/rejecting.");
            }
            if (dto.getApprovalDate() == null) {
                dto.setApprovalDate(LocalDate.now());
            }
        }

        mapper.updateApproval(entity, dto, approvedBy);

        // optional: nếu APPROVED -> có thể cập nhật trạng thái Contract ở Service khác/Domain event

        return mapper.toDTO(entity);
    }

    @Transactional
    public AnnulContractRequestDTO updateMinor(Integer id, AnnulContractRequestUpdateDTO dto) {
        AnnulContractRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annul request not found: " + id));

        // chỉ cho phép chỉnh các field không thay đổi phê duyệt
        if (dto.getAttachedFiles() != null) entity.setAttachedFiles(dto.getAttachedFiles());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());

        return mapper.toDTO(entity);
    }

    @Transactional
    public void delete(Integer id) {
        AnnulContractRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annul request not found: " + id));
        repository.delete(entity);
    }
}
