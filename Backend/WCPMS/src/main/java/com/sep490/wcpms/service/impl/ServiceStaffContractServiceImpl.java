package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import com.sep490.wcpms.entity.Contract.PaymentMethod;
import com.sep490.wcpms.repository.ServiceStaffContractRepository;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.sep490.wcpms.mapper.SupportTicketMapper;
import com.sep490.wcpms.repository.CustomerFeedbackRepository;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.CustomerRepository; // <-- THÊM IMPORT NÀY
import com.sep490.wcpms.repository.WaterMeterRepository;
import com.sep490.wcpms.repository.MeterInstallationRepository; // Thêm import

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// Import mới cho việc tạo hợp đồng dịch vụ nước
import com.sep490.wcpms.repository.WaterServiceContractRepository;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import org.springframework.context.ApplicationEventPublisher; // publish domain events
import com.sep490.wcpms.event.SurveyReportApprovedEvent;
import com.sep490.wcpms.event.ContractSentToInstallationEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import lombok.extern.slf4j.Slf4j;
import com.sep490.wcpms.repository.ContractAnnulTransferRequestRepository;
import com.sep490.wcpms.service.ContractAnnulTransferRequestService; // thêm import
import com.sep490.wcpms.dto.ContractAnnulTransferRequestUpdateDTO; // thêm import

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceStaffContractServiceImpl implements ServiceStaffContractService {

    private final ServiceStaffContractRepository contractRepository;
    private final AccountRepository accountRepository; // tuỳ chọn, dùng khi cần gán serviceStaff hoặc technicalStaff
    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final SupportTicketMapper supportTicketMapper;
    private final CustomerRepository customerRepository;
    private final WaterMeterRepository waterMeterRepository;
    private final WaterServiceContractRepository waterServiceContractRepository;
    private final WaterPriceTypeRepository waterPriceTypeRepository;
    private final MeterInstallationRepository meterInstallationRepository; // Thêm repository inject
    private final ApplicationEventPublisher eventPublisher; // Inject publisher
    private final ContractAnnulTransferRequestRepository contractAnnulTransferRequestRepository; // Inject repository cho annul/transfer requests
    private final ContractAnnulTransferRequestService contractAnnulTransferRequestService; // delegate to central service
    // private final ContractMapper contractMapper;

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

        // Chỉ cập nhật các trường được phép (an toàn với null)
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
        // Nếu cung cấp serviceStaffId và tồn tại thì gán (tuỳ chọn)
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
        return convertToDTOWithImage(contract); // Sử dụng bản có ảnh cho màn chi tiết
    }

    @Override
    public Page<ServiceStaffContractDTO> getDraftContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.DRAFT, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public ServiceStaffContractDTO submitContractForSurvey(Integer contractId, Integer technicalStaffId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép chuyển từ DRAFT sang PENDING
        if (contract.getContractStatus() != ContractStatus.DRAFT) {
            throw new RuntimeException("Cannot submit non-DRAFT contract. Current status: " + contract.getContractStatus());
        }

        // ✅ Tự động gán Nhân viên Dịch vụ hiện tại nếu chưa gán
        if (contract.getServiceStaff() == null) {
            // Lấy ID của Nhân viên Dịch vụ hiện tại từ SecurityContext
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                throw new IllegalStateException("User not authenticated");
            }
            
            Integer currentUserId;
            if (auth.getPrincipal() instanceof UserDetailsImpl user) {
                currentUserId = user.getId();
            } else {
                String username = auth.getName();
                Account currentAccount = accountRepository.findByUsername(username)
                        .orElseThrow(() -> new IllegalStateException("Account not found: " + username));
                currentUserId = currentAccount.getId();
            }
            
            Account currentServiceStaff = accountRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Service Staff not found with id: " + currentUserId));

            contract.setServiceStaff(currentServiceStaff);
            log.info("[SUBMIT-SURVEY] Auto-assigned serviceStaffId={} to contractId={}", currentUserId, contractId);
        }

        // Tìm và gán Nhân viên Kỹ thuật
        Account technicalStaff = accountRepository.findById(technicalStaffId)
                .orElseThrow(() -> new RuntimeException("Technical staff not found with id: " + technicalStaffId));


        // Kiểm tra vai trò của tài khoản (tùy chọn nhưng nên có)
        if (technicalStaff.getRole() == null || technicalStaff.getRole().getRoleName() != Role.RoleName.TECHNICAL_STAFF) {
            throw new IllegalArgumentException("Account is not a technical staff.");
        }

        contract.setTechnicalStaff(technicalStaff);
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
    @Transactional
    public ServiceStaffContractDTO approveSurveyReport(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép duyệt hợp đồng có trạng thái PENDING_SURVEY_REVIEW
        if (contract.getContractStatus() != ContractStatus.PENDING_SURVEY_REVIEW) {
            throw new RuntimeException("Cannot approve contract not in PENDING_SURVEY_REVIEW status. Current status: " + contract.getContractStatus());
        }

        contract.setContractStatus(ContractStatus.APPROVED);
        Contract updated = contractRepository.save(contract);
        // Phát hành sự kiện duyệt khảo sát
        eventPublisher.publishEvent(new SurveyReportApprovedEvent(
                updated.getId(),
                updated.getContractNumber(),
                updated.getServiceStaff() != null ? updated.getServiceStaff().getId() : null,
                updated.getCustomer() != null ? updated.getCustomer().getCustomerName() : null,
                java.time.LocalDateTime.now()
        ));
        return convertToDTO(updated);
    }

    @Override
    public Page<ServiceStaffContractDTO> getApprovedContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.APPROVED, keyword, pageable)
                .map(this::convertToDTO);
    }

    // === Quản lý hợp đồng ACTIVE ===

    @Override
    public Page<ServiceStaffContractDTO> getActiveContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.ACTIVE, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public ServiceStaffContractDTO updateActiveContract(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép cập nhật hợp đồng ACTIVE
        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE contracts can be updated. Current status: " + contract.getContractStatus());
        }

        // Update chỉ những trường được phép
        if (updateRequest.getContractValue() != null) {
            contract.setContractValue(updateRequest.getContractValue());
        }
        if (updateRequest.getEndDate() != null) {
            contract.setEndDate(updateRequest.getEndDate());
        }
        if (updateRequest.getNotes() != null) {
            contract.setNotes(updateRequest.getNotes());
        }

        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    public ServiceStaffContractDTO renewContract(Integer contractId, ServiceStaffUpdateContractRequestDTO renewRequest) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép gia hạn hợp đồng ACTIVE
        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE contracts can be renewed. Current status: " + contract.getContractStatus());
        }

        // Cập nhật ngày kết thúc mới
        if (renewRequest.getEndDate() != null) {
            contract.setEndDate(renewRequest.getEndDate());
        } else {
            throw new IllegalArgumentException("End date is required for renewal");
        }

        if (renewRequest.getNotes() != null) {
            contract.setNotes(renewRequest.getNotes());
        }

        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    //LOGIC TẠM NGƯNG
    @Override
    @Transactional
    public ServiceStaffContractDTO suspendContract(Integer contractId, String reason) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE contracts can be suspended. Current: " + contract.getContractStatus());
        }

        contract.setContractStatus(ContractStatus.SUSPENDED);
        if (reason != null && !reason.isBlank()) {
            String existing = contract.getNotes();
            contract.setNotes((existing == null ? "" : existing + "\n") + "[Suspend]: " + reason);
        }

        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    //LOGIC KÍCH HOẠT LẠI
    @Override
    @Transactional
    public ServiceStaffContractDTO reactivateContract(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        if (contract.getContractStatus() != ContractStatus.SUSPENDED) {
            throw new IllegalStateException("Only SUSPENDED contracts can be reactivated. Current: " + contract.getContractStatus());
        }

        contract.setContractStatus(ContractStatus.ACTIVE);
        // Có thể thêm log vào notes nếu cần
        // String existing = contract.getNotes();
        // contract.setNotes((existing == null ? "" : existing + "\n") + "[Reactivate]: Activated on " + LocalDate.now());

        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    public ServiceStaffContractDTO terminateContract(Integer contractId, String reason) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép hủy hợp đồng ACTIVE
        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE contracts can be terminated. Current status: " + contract.getContractStatus());
        }

        // Chuyển trạng thái sang TERMINATED
        contract.setContractStatus(ContractStatus.TERMINATED);
        contract.setEndDate(java.time.LocalDate.now());

        if (reason != null && !reason.isBlank()) {
            contract.setNotes(reason);
        }

        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
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
        dto.setPaymentMethod(c.getPaymentMethod() != null ? c.getPaymentMethod().name() : null); // MỚI
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

        // Lấy giá tiền loại từ Chi tiết Sử dụng Hợp đồng
        if (c.getContractUsageDetails() != null && !c.getContractUsageDetails().isEmpty()) {
            // Lấy phần tử đầu tiên từ danh sách (nếu có nhiều, lấy cái đầu)
            ContractUsageDetail firstUsageDetail = c.getContractUsageDetails().get(0);
            if (firstUsageDetail != null && firstUsageDetail.getPriceType() != null) { // Thêm kiểm tra null
                dto.setPriceTypeName(firstUsageDetail.getPriceType().getTypeName());
            }
        }

        return dto;
    }

    // Phiên bản mở rộng: thêm ảnh lắp đặt (chỉ dùng cho API chi tiết)
    private ServiceStaffContractDTO convertToDTOWithImage(Contract c) {
        ServiceStaffContractDTO dto = convertToDTO(c);
        meterInstallationRepository.findTopByContractOrderByInstallationDateDesc(c)
                .ifPresent(mi -> dto.setInstallationImageBase64(mi.getInstallationImageBase64()));
        return dto;
    }

    // === TRIỂN KHAI 3 HÀM MỚI (BƯỚC 2) ===

    @Override
    @Transactional(readOnly = true)
    public List<AccountDTO> getAvailableTechStaff() {
        // Lấy tất cả tài khoản có vai trò TECHNICAL_STAFF
        List<Account> techStaffList = accountRepository.findByRole_RoleName(Role.RoleName.TECHNICAL_STAFF);

        // Chuyển đổi Account sang AccountDTO (chỉ lấy ID và Tên)
        return techStaffList.stream()
                .map(account -> new AccountDTO(account.getId(), account.getFullName()))
                .collect(Collectors.toList());
    }

    // === CẬP NHẬT HÀM NÀY (Bước 4) ===
    @Override
    @Transactional(readOnly = true)
    public Page<SupportTicketDTO> getSupportTickets(Pageable pageable) {
        // SỬA LẠI: Lấy TẤT CẢ các ticket (cả SUPPORT_REQUEST và FEEDBACK)
        // đang ở trạng thái PENDING, bằng cách gọi hàm findByStatus.
        Page<CustomerFeedback> tickets = customerFeedbackRepository.findByStatus(
                CustomerFeedback.Status.PENDING,
                pageable
        );
        // Map kết quả sang DTO để trả về
        return tickets.map(supportTicketMapper::toDto);
    }
    // --- HẾT PHẦN CẬP NHẬT ---

    // === HÀM MỚI (Bước 4) ===
    @Override
    @Transactional
    public SupportTicketDTO submitFeedbackReply(Integer ticketId, FeedbackReplyDTO dto, Integer staffId) {
        // 1. Tìm ticket
        CustomerFeedback ticket = customerFeedbackRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Góp ý (Ticket) với ID: " + ticketId));

        // 2. Tìm NV Dịch vụ (người trả lời)
        Account staff = accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Nhân viên Dịch vụ với ID: " + staffId));

        // 3. Kiểm tra loại và trạng thái
        if (ticket.getFeedbackType() != CustomerFeedback.FeedbackType.FEEDBACK) {
            throw new IllegalStateException("Chức năng này chỉ dùng để trả lời 'FEEDBACK'. (Yêu cầu Hỗ trợ cần được 'Gán việc').");
        }
        if (ticket.getStatus() != CustomerFeedback.Status.PENDING) {
            throw new IllegalStateException("Chỉ có thể trả lời các Góp ý đang ở trạng thái PENDING.");
        }

        // 4. Cập nhật nội dung trả lời và trạng thái
        ticket.setResponse(dto.getResponseContent()); // Gán nội dung trả lời
        ticket.setAssignedTo(staff); // Ghi nhận NV Dịch vụ đã xử lý (cột assigned_to)
        ticket.setStatus(CustomerFeedback.Status.RESOLVED); // Chuyển sang "Đã giải quyết"
        ticket.setResolvedDate(LocalDateTime.now()); // Ghi nhận ngày giải quyết

        CustomerFeedback savedTicket = customerFeedbackRepository.save(ticket);

        return supportTicketMapper.toDto(savedTicket);
    }
    // --- HẾT PHẦN THÊM ---

    @Override
    @Transactional
    public SupportTicketDTO assignTechToTicket(Integer ticketId, Integer technicalStaffId) {
        // 1. Tìm Yêu cầu (Ticket)
        CustomerFeedback ticket = customerFeedbackRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Yêu cầu Hỗ trợ (Ticket) với ID: " + ticketId));

        // 2. Tìm NV Kỹ thuật
        Account techStaff = accountRepository.findById(technicalStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Nhân viên Kỹ thuật với ID: " + technicalStaffId));

        // 3. (Khuyến nghị) Kiểm tra xem có đúng là NV Kỹ thuật không
        if (techStaff.getRole() == null || techStaff.getRole().getRoleName() != Role.RoleName.TECHNICAL_STAFF) {
            throw new IllegalArgumentException("Tài khoản được gán không phải là Nhân viên Kỹ thuật.");
        }

        // 4. Kiểm tra trạng thái ticket
        if (ticket.getStatus() != CustomerFeedback.Status.PENDING) {
            throw new IllegalStateException("Chỉ có thể gán các Yêu cầu đang ở trạng thái PENDING.");
        }

        // 5. Gán việc và đổi trạng thái
        ticket.setAssignedTo(techStaff); // Gán NV Kỹ thuật
        ticket.setStatus(CustomerFeedback.Status.IN_PROGRESS); // Chuyển sang "Đang xử lý"
        ticket.setUpdatedAt(LocalDateTime.now()); // Cập nhật thời gian

        CustomerFeedback savedTicket = customerFeedbackRepository.save(ticket);

        return supportTicketMapper.toDto(savedTicket);
    }

    // === TRIỂN KHAI HÀM MỚI ===

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSimpleDTO> getSimpleCustomerList() {
        // Gọi hàm mới trong CustomerRepository
        return customerRepository.findSimpleList();
    }
    // --- HẾT PHẦN THÊM ---

    // --- TRIỂN KHAI HÀM MỚI ---
    @Override
    @Transactional(readOnly = true)
    public List<CustomerMeterDTO> getCustomerActiveMetersByCustomerId(Integer customerId) {
        // Gọi thẳng WaterMeterRepository
        return waterMeterRepository.findActiveMetersByCustomerId(customerId);
    }
    // --- HẾT PHẦN THÊM ---


    @Override
    @Transactional
    public ServiceStaffContractDTO generateWaterServiceContract(Integer contractId, Integer priceTypeId, LocalDate serviceStartDate) {
        Contract installContract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        if (installContract.getContractStatus() != ContractStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED contracts can generate Water Service Contract.");
        }
        if (installContract.getCustomer() == null) {
            throw new IllegalStateException("Contract missing customer");
        }
        if (priceTypeId == null) {
            throw new IllegalArgumentException("priceTypeId is required");
        }
        WaterPriceType priceType = waterPriceTypeRepository.findById(priceTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Water price type not found: " + priceTypeId));

        // Tạo số hợp đồng dịch vụ đơn giản: "WS-" + số lắp đặt
        String wsNumber = "WS-" + installContract.getContractNumber();

        WaterServiceContract wsc = new WaterServiceContract();
        wsc.setContractNumber(wsNumber);
        wsc.setCustomer(installContract.getCustomer());
        wsc.setPriceType(priceType);
        wsc.setServiceStartDate(serviceStartDate != null ? serviceStartDate : (installContract.getStartDate() != null ? installContract.getStartDate() : LocalDate.now()));
        wsc.setContractSignedDate(null); // sẽ cập nhật khi khách ký
        wsc.setContractStatus(WaterServiceContract.WaterServiceContractStatus.ACTIVE); // có thể để ACTIVE sau ký, nhưng theo yêu cầu ta tạo record trước
        wsc.setSourceContract(installContract);

        WaterServiceContract saved = waterServiceContractRepository.save(wsc);

        // Gắn vào hợp đồng lắp đặt làm primary_water_contract_id
        installContract.setPrimaryWaterContract(saved);
        contractRepository.save(installContract);

        return convertToDTO(installContract);
    }

    @Override
    @Transactional
    public ServiceStaffContractDTO sendContractToCustomerForSign(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));
        if (contract.getContractStatus() != ContractStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED contracts can be sent to customer for signing.");
        }
        // Theo luồng mới: APPROVED -> PENDING_CUSTOMER_SIGN (gửi cho khách ký)
        // Sau khi khách ký, trạng thái sẽ chuyển từ PENDING_CUSTOMER_SIGN -> PENDING_SIGN
        contract.setContractStatus(ContractStatus.PENDING_CUSTOMER_SIGN);
        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public ServiceStaffContractDTO sendContractToInstallation(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));
        if (contract.getContractStatus() != ContractStatus.PENDING_SIGN) {
            throw new IllegalStateException("Only PENDING_SIGN contracts can be sent to installation.");
        }
        contract.setContractStatus(ContractStatus.SIGNED);
        Contract updated = contractRepository.save(contract);
        // Publish event gửi lắp đặt để thông báo cho Service Staff
        eventPublisher.publishEvent(new ContractSentToInstallationEvent(
                this, // source object
                updated.getId(),
                updated.getContractNumber(),
                updated.getServiceStaff() != null ? updated.getServiceStaff().getId() : null,
                updated.getTechnicalStaff() != null ? updated.getTechnicalStaff().getId() : null,
                updated.getCustomer() != null ? updated.getCustomer().getCustomerName() : null,
                java.time.LocalDateTime.now()
        ));
        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public ServiceStaffContractDTO rejectSurveyReport(Integer contractId, String reason) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        if (contract.getContractStatus() != ContractStatus.PENDING_SURVEY_REVIEW) {
            throw new IllegalStateException("Only contracts in PENDING_SURVEY_REVIEW can be rejected.");
        }

        // Quay lại trạng thái PENDING để kỹ thuật sửa/khảo sát lại
        contract.setContractStatus(ContractStatus.PENDING);
        if (reason != null && !reason.isBlank()) {
            String existing = contract.getNotes();
            String merged = (existing == null || existing.isBlank())
                    ? ("Reject reason: " + reason)
                    : (existing + "\nReject reason: " + reason);
            contract.setNotes(merged);
        }
        Contract saved = contractRepository.save(contract);
        return convertToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceStaffContractDTO> getPendingSignContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.PENDING_SIGN, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContractAnnulTransferRequestDTO> getPendingAnnulTransferRequests(String keyword, Pageable pageable) {
        // Giả sử repository có method findByStatus với PENDING
        // Nếu không có, cần thêm vào repository
        //        return contractAnnulTransferRequestRepository.findByApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus.PENDING, pageable)
        //                .map(this::convertToAnnulTransferDTO);
        // Use the new repository method to fetch customers eagerly so names are available
        return contractAnnulTransferRequestRepository.findWithCustomersByApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus.PENDING, pageable)
                .map(this::convertToAnnulTransferDTO);
    }

    @Override
    @Transactional
    public ContractAnnulTransferRequestDTO approveAnnulTransferRequest(Integer requestId) {
        // Delegate to ContractAnnulTransferRequestService to reuse validation and mapping logic
        ContractAnnulTransferRequestUpdateDTO dto = ContractAnnulTransferRequestUpdateDTO.builder()
                .approvalStatus(ContractAnnulTransferRequest.ApprovalStatus.APPROVED)
                .approvalDate(LocalDate.now())
                .build();

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl ud) {
                dto.setApprovedById(ud.getId());
            }
        } catch (Exception ex) {
            // ignore - central service will validate
        }

        return contractAnnulTransferRequestService.updateApproval(requestId, dto);
    }

    @Override
    @Transactional
    public ContractAnnulTransferRequestDTO rejectAnnulTransferRequest(Integer requestId, String reason) {
        // Delegate to central service to enforce notes required for rejection
        ContractAnnulTransferRequestUpdateDTO dto = ContractAnnulTransferRequestUpdateDTO.builder()
                .approvalStatus(ContractAnnulTransferRequest.ApprovalStatus.REJECTED)
                .approvalDate(LocalDate.now())
                .notes(reason)
                .build();

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl ud) {
                dto.setApprovedById(ud.getId());
            }
        } catch (Exception ex) {
            // ignore
        }

        return contractAnnulTransferRequestService.updateApproval(requestId, dto);
    }

    private ContractAnnulTransferRequestDTO convertToAnnulTransferDTO(ContractAnnulTransferRequest request) {
        ContractAnnulTransferRequestDTO dto = new ContractAnnulTransferRequestDTO();
        dto.setId(request.getId());
        dto.setRequestType(request.getRequestType() != null ? request.getRequestType().name() : null);
        dto.setStatus(request.getApprovalStatus() != null ? request.getApprovalStatus().name() : null);
        dto.setReason(request.getReason());
        dto.setRejectionReason(request.getRejectionReason());
        dto.setCreatedDate(request.getCreatedAt());
        dto.setProcessedDate(request.getApprovalDate());
        // Also populate createdAt/updatedAt (some frontend expects these names)
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        if (request.getContract() != null) {
            dto.setContractId(request.getContract().getId());
            dto.setContractNumber(request.getContract().getContractNumber());
        }
        if (request.getRequestedBy() != null) {
            dto.setRequesterId(request.getRequestedBy().getId());
            dto.setRequesterName(request.getRequestedBy().getFullName());
        }
        // Set customer ids and names for transfer requests
        //        if (request.getFromCustomer() != null) {
        //            dto.setFromCustomerId(request.getFromCustomer().getId());
        //            dto.setFromCustomerName(request.getFromCustomer().getCustomerName());
        //        }
        //        if (request.getToCustomer() != null) {
        //            dto.setToCustomerId(request.getToCustomer().getId());
        //            dto.setToCustomerName(request.getToCustomer().getCustomerName());
        //        }
        // The repository fetches fromCustomer/toCustomer eagerly; still guard for null
        if (request.getFromCustomer() != null) {
            dto.setFromCustomerId(request.getFromCustomer().getId());
            dto.setFromCustomerName(request.getFromCustomer().getCustomerName());
        } else {
            // Fallback: set fromCustomerName from the contract's customer (current owner)
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
        return dto;
    }
}
