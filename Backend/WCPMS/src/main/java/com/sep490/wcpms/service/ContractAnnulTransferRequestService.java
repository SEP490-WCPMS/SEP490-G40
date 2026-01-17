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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.sep490.wcpms.repository.WaterMeterRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.WaterServiceContractRepository;
import com.sep490.wcpms.repository.MeterInstallationRepository;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractAnnulTransferRequestService {

    private final ContractAnnulTransferRequestRepository repository;
    private final ContractRepository contractRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository; // cần nếu validate from/to
    private final RoleRepository roleRepository;
    private final ContractAnnulTransferRequestMapper mapper;

    //Repo cần thiết sau khi thay đổi
    private final WaterMeterRepository waterMeterRepository;
    private final InvoiceRepository invoiceRepository;
    private final WaterServiceContractRepository waterServiceContractRepository;
    private final MeterInstallationRepository meterInstallationRepository;

    // Helper: chọn Service Staff ít việc nhất (dựa trên bảng annul_transfer_contract_requests)
//    private Account pickLeastBusyServiceStaffForAnnulTransfer() {
//        Role serviceRole = roleRepository.findByRoleName(Role.RoleName.SERVICE_STAFF)
//                .orElseThrow(() ->
//                        new IllegalStateException("Role SERVICE_STAFF không tồn tại trong hệ thống"));
//
//        return accountRepository.findServiceStaffWithLeastAnnulTransferWorkload(serviceRole.getId())
//                .orElseThrow(() -> new IllegalStateException(
//                        "Không tìm thấy nhân viên dịch vụ đang ACTIVE để phân công xử lý yêu cầu hủy/chuyển."
//                ));
//    }

    /**
     * Chọn Service Staff ít việc nhất nhưng phải thuộc tuyến (ReadingRoute) của hợp đồng.
     * Ưu tiên theo số lượng yêu cầu hủy/chuyển đang PENDING được phân công (ít -> nhiều).
     */
    private Account pickLeastBusyServiceStaffForAnnulTransferForContract(Contract contract) {
        if (contract == null) {
            throw new IllegalArgumentException("contract must not be null.");
        }

        ReadingRoute route = contract.getReadingRoute();
        if (route == null || route.getId() == null) {
            throw new IllegalStateException(
                    "Hợp đồng chưa được gán tuyến đọc nên không thể tự động phân công Service Staff."
            );
        }

        // Validate tuyến còn ACTIVE
        if (route.getStatus() != null && route.getStatus() != ReadingRoute.Status.ACTIVE) {
            throw new IllegalStateException(
                    "Tuyến đọc của hợp đồng đang INACTIVE, không thể tạo yêu cầu hủy/chuyển. Vui lòng kiểm tra lại tuyến."
            );
        }

        // Validate tuyến có ít nhất 1 Service Staff được gán quản lý
        if (route.getServiceStaffs() == null || route.getServiceStaffs().isEmpty()) {
            throw new IllegalStateException(
                    "Tuyến đọc của hợp đồng chưa được gán Service Staff. Vui lòng gán nhân viên trước."
            );
        }

        Role serviceRole = roleRepository.findByRoleName(Role.RoleName.SERVICE_STAFF)
                .orElseThrow(() -> new IllegalStateException("Role SERVICE_STAFF không tồn tại trong hệ thống"));

        return accountRepository
                .findServiceStaffWithLeastAnnulTransferWorkloadForRoute(serviceRole.getId(), route.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy nhân viên dịch vụ đang ACTIVE thuộc tuyến để phân công xử lý yêu cầu hủy/chuyển."
                ));
    }

    /**
     * Helper: từ một ID FE gửi lên (có thể là customerId HOẶC accountId),
     * cố gắng resolve ra Customer:
     *  1) thử coi là customers.id
     *  2) nếu không có, thử coi là customers.account.id
     */
    private Customer resolveCustomerFlexible(Integer idFromDto, String contextLabel) {
        if (idFromDto == null) {
            throw new IllegalArgumentException(contextLabel + "CustomerId is required.");
        }

        // 1) Thử tìm theo customer.id
        Optional<Customer> byCustomerId = customerRepository.findById(idFromDto);
        if (byCustomerId.isPresent()) {
            return byCustomerId.get();
        }

        // 2) Không có → thử theo account.id
        Optional<Customer> byAccountId = customerRepository.findByAccount_Id(idFromDto);
        if (byAccountId.isPresent()) {
            return byAccountId.get();
        }

        // 3) Không tìm được
        throw new ResourceNotFoundException(
                contextLabel + "-customer not found by customerId/accountId: " + idFromDto
        );
    }

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

        // Kiểm tra trạng thái hợp đồng phải là ACTIVE
        if (contract.getContractStatus() != Contract.ContractStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Chỉ những hợp đồng đang ở trạng thái ACTIVE mới được tạo yêu cầu hủy/chuyển."
            );
        }

        // Kiểm tra hợp đồng đã có yêu cầu hủy/chuyển đang PENDING chưa
        if (repository.existsByContractIdAndApprovalStatus(
                contract.getId(),
                ContractAnnulTransferRequest.ApprovalStatus.PENDING)) {
            throw new IllegalStateException("This contract already has a pending annul/transfer request.");
        }

        Customer fromCustomer = null, toCustomer = null;

        // Chỉ cần validate from/to khi là chuyển nhượng
        if (type.equalsIgnoreCase("transfer")) {
            if (dto.getFromCustomerId() == null || dto.getToCustomerId() == null) {
                throw new IllegalArgumentException("fromCustomerId and toCustomerId are required for transfer.");
            }
            // fromCustomerId / toCustomerId có thể là customers.id hoặc accounts.id
            Integer fromId = dto.getFromCustomerId();
            Integer toId   = dto.getToCustomerId();

            fromCustomer = resolveCustomerFlexible(fromId, "From");
            toCustomer   = resolveCustomerFlexible(toId,   "To");

            // validate fromCustomer trùng với chủ hợp đồng và toCustomer phải là tài khoản khác, là CUSTOMER và đang hoạt động
            boolean sameCustomerId = Objects.equals(fromCustomer.getId(), toCustomer.getId());
            boolean sameAccountId = (fromCustomer.getAccount() != null && toCustomer.getAccount() != null)
                    && Objects.equals(fromCustomer.getAccount().getId(), toCustomer.getAccount().getId());

            // không thể chuyển cho chính mình
            if (sameCustomerId || sameAccountId) {
                throw new IllegalArgumentException("Không thể chuyển hợp đồng cho chính mình.");
            }

            // validate fromCustomer là chủ hợp đồng hiện tại
            if (contract.getCustomer() == null) {
                throw new IllegalStateException("Hợp đồng không có khách.");
            }

            // validate fromCustomer trùng với chủ hợp đồng
            if (!Objects.equals(contract.getCustomer().getId(), fromCustomer.getId())) {
                throw new IllegalArgumentException("fromCustomerId không khớp với chủ hợp đồng hiện tại.");
            }

            // validate toCustomer là tài khoản CUSTOMER và đang hoạt động
            if (toCustomer.getAccount() == null
                    || toCustomer.getAccount().getRole() == null
                    || toCustomer.getAccount().getRole().getRoleName() != Role.RoleName.CUSTOMER) {
                throw new IllegalArgumentException("toCustomerId phải là tài khoản khách hàng hợp lệ.");
            }

            // validate tài khoản toCustomer đang hoạt động
            if (toCustomer.getAccount().getStatus() != null && toCustomer.getAccount().getStatus() == 0) {
                throw new IllegalArgumentException("Tài khoản nhận chuyển nhượng đang bị khóa/không hoạt động.");
            }
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

        // tự động phân công nhân viên Service ít việc nhất
        Account assignedServiceStaff = pickLeastBusyServiceStaffForAnnulTransferForContract(contract);
        entity.setServiceStaff(assignedServiceStaff);

        entity = repository.save(entity);

        try {
            // log kết và trả về DTO
            ContractAnnulTransferRequestDTO out = convertToAnnulTransferDTO(entity);
            log.info("[REQUEST CREATED] id={}, contractId={}, type={}, requestedById={}", out.getId(), out.getContractId(), out.getRequestType(), out.getRequestedById());
            return out;
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] failed to map Entity -> DTO after save. entityId={}", entity.getId(), ex);
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
    public Page<ContractAnnulTransferRequestDTO> search(Integer requestedById,
                                                        Integer contractId,
                                                        String requestType,
                                                        String status,
                                                        LocalDate from,
                                                        LocalDate to,
                                                        String q,
                                                        Pageable pageable) {
        // Xây dựng Specification động
        Specification<ContractAnnulTransferRequest> spec = Specification.allOf(
                ContractAnnulTransferRequestSpecs.requestedByEq(requestedById),
                ContractAnnulTransferRequestSpecs.contractIdEq(contractId),
                ContractAnnulTransferRequestSpecs.typeEq(requestType),
                ContractAnnulTransferRequestSpecs.statusEq(status),
                ContractAnnulTransferRequestSpecs.requestDateGte(from),
                ContractAnnulTransferRequestSpecs.requestDateLte(to),
                ContractAnnulTransferRequestSpecs.qLike(q)
        );

        // Nếu user hiện tại là Service Staff thì chỉ xem được những request do mình xử lý
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()
                    && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {

                Object principal = auth.getPrincipal();
                Integer currentUserId = null;
                boolean isServiceStaff = false;

                // Ưu tiên lấy từ UserDetailsImpl
                try {
                    if (principal instanceof com.sep490.wcpms.security.services.UserDetailsImpl ud) {
                        currentUserId = ud.getId();
                        isServiceStaff = ud.getAuthorities().stream()
                                .anyMatch(a -> "SERVICE_STAFF".equals(a.getAuthority()));
                    }
                } catch (Exception ignored) {
                }

                // Fallback: lookup Account theo username
                if (currentUserId == null) {
                    try {
                        String username = auth.getName();
                        Optional<Account> acc = accountRepository.findByUsername(username);
                        if (acc.isPresent()) {
                            currentUserId = acc.get().getId();
                            isServiceStaff = acc.get().getRole() != null
                                    && acc.get().getRole().getRoleName() == Role.RoleName.SERVICE_STAFF;
                        }
                    } catch (Exception ignored) {
                    }
                }

                if (isServiceStaff && currentUserId != null) {
                    spec = spec.and(ContractAnnulTransferRequestSpecs.serviceStaffEq(currentUserId));
                }
            }
        } catch (Exception ignored) {
            // có lỗi khi lấy user hiện tại, bỏ qua không filter
        }

        Page<ContractAnnulTransferRequest> page = repository.findAll(spec, pageable);

        // Map entity -> DTO với fallback, tránh nổ 500 chỉ vì 1 record lỗi
        return page.map(entity -> {
            try {
                return convertToAnnulTransferDTO(entity);
            } catch (Exception ex) {
                log.error("[MAPPER ERROR] convertToAnnulTransferDTO failed during search mapping. entityId={}",
                        entity.getId(), ex);

                // Fallback DTO tối thiểu để FE vẫn dùng được contractId cho việc lọc
                ContractAnnulTransferRequestDTO dto = new ContractAnnulTransferRequestDTO();
                dto.setId(entity.getId());

                if (entity.getContract() != null) {
                    dto.setContractId(entity.getContract().getId());
                    dto.setContractNumber(entity.getContract().getContractNumber());
                }

                if (entity.getRequestType() != null) {
                    dto.setRequestType(entity.getRequestType().name());
                }
                if (entity.getApprovalStatus() != null) {
                    dto.setApprovalStatus(entity.getApprovalStatus().name());
                }
                return dto;
            }
        });
    }

    // === UPDATE APPROVAL (ĐÃ SỬA: Check Nợ + Xử lý hậu kỳ) ===
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
            // Kiểm tra rejectionReason thay vì notes
            if (dto.getRejectionReason() == null || dto.getRejectionReason().trim().isEmpty()) {
                // Nếu rejectionReason trống, thử check sang notes (để tương thích ngược nếu cần)
                if (dto.getNotes() == null || dto.getNotes().trim().isEmpty()) {
                    throw new IllegalArgumentException("Lý do từ chối là bắt buộc.");
                } else {
                    // Nếu có notes mà ko có rejectionReason, thì copy notes sang rejectionReason
                    dto.setRejectionReason(dto.getNotes());
                }
            }
        }

        try {
            mapper.updateApproval(entity, dto, approvedBy);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] updateApproval failed for id={}. dto={}", id, dto, ex);
            throw ex;
        }

        // --- HỆ QUẢ KHI DUYỆT THÀNH CÔNG (APPROVED) ---
        if (ContractAnnulTransferRequest.ApprovalStatus.APPROVED.equals(dto.getApprovalStatus())) {
            Contract contract = entity.getContract();

            // --- KIỂM TRA CÔNG NỢ ---
            // Chỉ chặn duyệt nếu còn hóa đơn ở trạng thái PENDING (theo yêu cầu):
            List<Invoice.PaymentStatus> debtStatuses = Collections.singletonList(Invoice.PaymentStatus.PENDING);
            if (invoiceRepository.existsByContract_IdAndPaymentStatusIn(contract.getId(), debtStatuses)) {
                throw new IllegalStateException("Không thể duyệt. Hợp đồng vẫn còn hóa đơn đang chờ xử lý. Cần xử lý những hóa đơn chưa thanh toán đó trước khi duyệt yêu cầu.");
            }

            // 1. XỬ LÝ HỦY HỢP ĐỒNG (ANNUL)
            if (entity.getRequestType() == ContractAnnulTransferRequest.RequestType.ANNUL) {
                // A. Update Hợp đồng Lắp đặt (Cũ)
                contract.setContractStatus(Contract.ContractStatus.TERMINATED);
                if (contract.getEndDate() == null) {
                    contract.setEndDate(LocalDate.now());
                }

                // B. [MỚI] Update Hợp đồng Dịch vụ -> NGỪNG SINH HÓA ĐƠN
                if (contract.getPrimaryWaterContract() != null) {
                    WaterServiceContract wsc = contract.getPrimaryWaterContract();
                    wsc.setContractStatus(WaterServiceContract.WaterServiceContractStatus.TERMINATED);
                    wsc.setServiceEndDate(LocalDate.now());
                    waterServiceContractRepository.save(wsc);
                }

                // C. [MỚI] Update Đồng hồ -> NGỪNG GHI NƯỚC (RETIRED)
                Optional<MeterInstallation> installOpt = meterInstallationRepository.findTopByContractOrderByInstallationDateDesc(contract);
                if (installOpt.isPresent()) {
                    WaterMeter meter = installOpt.get().getWaterMeter();
                    if (meter != null) {
                        meter.setMeterStatus(WaterMeter.MeterStatus.RETIRED); // Đánh dấu không dùng nữa
                        waterMeterRepository.save(meter);
                    }
                }

                log.info("[APPROVAL] Annul approved - contract {} terminated", contract.getId());
            }

            // 2. XỬ LÝ CHUYỂN NHƯỢNG (TRANSFER)
            if (entity.getRequestType() == ContractAnnulTransferRequest.RequestType.TRANSFER) {
                if (entity.getToCustomer() == null) {
                    throw new IllegalStateException("toCustomer is required for transfer approval.");
                }

                Customer newOwner = entity.getToCustomer();

                // A. Sang tên Hợp đồng Lắp đặt (Cũ)
                contract.setCustomer(newOwner);
                if (newOwner.getAccount() != null) {
                    contract.setContactPhone(newOwner.getAccount().getPhone());
                }

                // B. Sang tên Hợp đồng Dịch vụ -> ĐỂ KẾ TOÁN IN HÓA ĐƠN ĐÚNG TÊN MỚI
                if (contract.getPrimaryWaterContract() != null) {
                    WaterServiceContract wsc = contract.getPrimaryWaterContract();
                    // Chỉ cập nhật nếu HĐ đang Active
                    if (wsc.getContractStatus() == WaterServiceContract.WaterServiceContractStatus.ACTIVE) {
                        wsc.setCustomer(newOwner);
                        waterServiceContractRepository.save(wsc);
                    }
                }

                // C. [MỚI] Sang tên Biên bản lắp đặt -> ĐỂ LỊCH SỬ ĐỒNG HỒ ĐÚNG CHỦ
                // (Optional<MeterInstallation> đã lấy ở trên, nhưng ở đây cần lấy lại hoặc dùng chung)
                Optional<MeterInstallation> installOpt = meterInstallationRepository.findTopByContractOrderByInstallationDateDesc(contract);
                if (installOpt.isPresent()) {
                     MeterInstallation install = installOpt.get();
                     install.setCustomer(newOwner);
                     // Cập nhật lại WaterServiceContract trong Installation (nếu cần thiết, nhưng thường nó trỏ theo object nên tự update)
                     // Nếu có HĐ Dịch vụ liên kết với hợp đồng này, đảm bảo bản ghi lắp đặt cũng trỏ tới HĐ Dịch vụ vừa cập nhật
                     WaterServiceContract latestWsc = contract.getPrimaryWaterContract();
                     if (latestWsc != null) {
                         install.setWaterServiceContract(latestWsc);
                     }
                     meterInstallationRepository.save(install);
                 }

                log.info("[APPROVAL] Transfer approved - contract {} moved to customer {}", contract.getId(), entity.getToCustomer().getId());
            }

            contractRepository.save(contract);
        }

        entity = repository.save(entity);

        try {
            // Use converter with fallback for customer names
            return convertToAnnulTransferDTO(entity);
        } catch (Exception ex) {
            log.error("[MAPPER ERROR] toDTO failed after approval save for id={}", entity.getId(), ex);
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

    // Helper: convert Entity -> DTO
    public ContractAnnulTransferRequestDTO convertToAnnulTransferDTO(ContractAnnulTransferRequest request) {
        ContractAnnulTransferRequestDTO dto = new ContractAnnulTransferRequestDTO();
        dto.setId(request.getId());
        // map request and contract identifiers
        dto.setRequestNumber(request.getRequestNumber());
        if (request.getContract() != null) {
            dto.setContractId(request.getContract().getId());
            dto.setContractNumber(request.getContract().getContractNumber());
        }

        dto.setRequestType(request.getRequestType() != null ? request.getRequestType().name() : null);
        dto.setApprovalStatus(request.getApprovalStatus() != null ? request.getApprovalStatus().name() : null);
        dto.setRequestedById(request.getRequestedBy() != null ? request.getRequestedBy().getId() : null);
        dto.setRequestedByUsername(request.getRequestedBy() != null ? request.getRequestedBy().getUsername() : null);
        dto.setRequestDate(request.getRequestDate());
        dto.setApprovalDate(request.getApprovalDate());
        dto.setReason(request.getReason());
        dto.setRejectionReason(request.getRejectionReason());
        dto.setCreatedDate(request.getCreatedAt());
        dto.setProcessedDate(request.getApprovalDate());
        dto.setNotes(request.getNotes());
        dto.setAttachedEvidence(request.getAttachedEvidence());

        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());

        if (request.getRequestedBy() != null) {
            dto.setRequestedById(request.getRequestedBy().getId());
            dto.setRequestedByUsername(request.getRequestedBy().getUsername());
        }

        if (request.getFromCustomer() != null) {
            dto.setFromCustomerId(request.getFromCustomer().getId());
            dto.setFromCustomerName(request.getFromCustomer().getCustomerName());
        } else {
            // Fallback: lấy từ hợp đồng nếu có
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
        // Nhân viên Service xử lý
        if (request.getServiceStaff() != null) {
            dto.setServiceStaffId(request.getServiceStaff().getId());
            dto.setServiceStaffName(request.getServiceStaff().getFullName());
        }
        return dto;
    }
}
