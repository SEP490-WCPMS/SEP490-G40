package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import com.sep490.wcpms.entity.Contract.PaymentMethod;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.InternalNotificationService;
import com.sep490.wcpms.entity.InternalNotification;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.sep490.wcpms.mapper.SupportTicketMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher; // publish domain events
import com.sep490.wcpms.event.SurveyReportApprovedEvent;
import com.sep490.wcpms.exception.ResourceNotFoundException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Import mới cho việc tạo hợp đồng dịch vụ nước

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import lombok.extern.slf4j.Slf4j;
import com.sep490.wcpms.service.ContractAnnulTransferRequestService; // thêm import
import com.sep490.wcpms.dto.ContractAnnulTransferRequestUpdateDTO; // thêm import
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.entity.ActivityLog;
import org.springframework.beans.factory.annotation.Autowired;

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
    private final ContractAnnulTransferRequestRepository contractAnnulTransferRequestRepository; // Inject repository cho annul/transfer requests
    private final ContractAnnulTransferRequestService contractAnnulTransferRequestService; // delegate to central service
    private final ApplicationEventPublisher eventPublisher;
    private final AddressRepository addressRepository;
    private final InternalNotificationService internalNotificationService;
    private final InternalNotificationRepository internalNotificationRepository;
    // private final ContractMapper contractMapper;

    @Autowired
    private ActivityLogService activityLogService; // NEW: persist activity logs for service actions

    // Helper to safely obtain current authenticated user's account ID.
    // Handles cases where Security principal is our UserDetailsImpl or when only username is present.
    private Integer getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;

            Object principal = auth.getPrincipal();
            if (principal instanceof UserDetailsImpl ud) {
                return ud.getId();
            }

            // Fallback: try by name (could be username, email, or numeric id)
            String name = auth.getName();
            if (name == null || name.isBlank()) return null;

            // If name is numeric, it might be user id stored as subject in token
            try {
                int id = Integer.parseInt(name);
                return accountRepository.findById(id).map(Account::getId).orElse(null);
            } catch (NumberFormatException ignored) {
            }

            // try username
            Optional<Account> byUsername = accountRepository.findByUsername(name);
            if (byUsername.isPresent()) return byUsername.get().getId();

            // try email
            Optional<Account> byEmail = accountRepository.findByEmail(name);
            if (byEmail.isPresent()) return byEmail.get().getId();

        } catch (Exception e) {
            // swallow - return null to indicate not available
        }
        return null;
    }

    @Override
    public Page<ServiceStaffContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable) {

        Integer currentUserId = getCurrentUserId();

        // --- LOGIC MỚI: XỬ LÝ NHÓM TRẠNG THÁI CHO TAB ACTIVE ---
        if ("ACTIVE_TAB_ALL".equalsIgnoreCase(status)) {
            // Định nghĩa nhóm 4 trạng thái
            List<ContractStatus> activeGroup = List.of(
                    ContractStatus.ACTIVE,
                    ContractStatus.SUSPENDED,
                    ContractStatus.TERMINATED,
                    ContractStatus.EXPIRED
            );

            if (currentUserId != null) {
                return contractRepository.findByServiceStaffAndStatusInAndKeyword(currentUserId, activeGroup, keyword, pageable)
                        .map(this::convertToDTO);
            }
            return contractRepository.findByStatusInAndKeyword(activeGroup, keyword, pageable)
                    .map(this::convertToDTO);
        }
        // -------------------------------------------------------

        // --- LOGIC CŨ ---
        ContractStatus contractStatus = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("all")) {
            try {
                contractStatus = ContractStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid contract status: " + status);
            }
        }

        if (currentUserId != null) {
            return contractRepository.findByServiceStaffAndStatusAndKeyword(currentUserId, contractStatus, keyword, pageable)
                    .map(this::convertToDTO);
        }
        return contractRepository.findByStatusAndKeyword(contractStatus, keyword, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional // Thêm Transactional để đảm bảo tính toàn vẹn dữ liệu
    public ServiceStaffContractDTO updateContractByServiceStaff(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // 1. Validate trạng thái cho phép sửa
        if (contract.getContractStatus() != ContractStatus.DRAFT &&
                contract.getContractStatus() != ContractStatus.PENDING_SURVEY_REVIEW &&
                contract.getContractStatus() != ContractStatus.APPROVED &&
                contract.getContractStatus() != ContractStatus.ACTIVE) {
            throw new RuntimeException("Cannot update contract in status: " + contract.getContractStatus());
        }

        // 2. Cập nhật các thông tin cơ bản
        if (updateRequest.getStartDate() != null) contract.setStartDate(updateRequest.getStartDate());
        if (updateRequest.getEndDate() != null) contract.setEndDate(updateRequest.getEndDate());
        if (updateRequest.getInstallationDate() != null) {
            contract.setInstallationDate(updateRequest.getInstallationDate());
        }
        if (updateRequest.getEstimatedCost() != null) contract.setEstimatedCost(updateRequest.getEstimatedCost());
        if (updateRequest.getContractValue() != null) contract.setContractValue(updateRequest.getContractValue());

        if (updateRequest.getPaymentMethod() != null && !updateRequest.getPaymentMethod().isBlank()) {
            try {
                PaymentMethod pm = PaymentMethod.valueOf(updateRequest.getPaymentMethod().toUpperCase());
                contract.setPaymentMethod(pm);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid payment method: " + updateRequest.getPaymentMethod());
            }
        }

        if (updateRequest.getServiceStaffId() != null) {
            Account staff = accountRepository.findById(updateRequest.getServiceStaffId())
                    .orElseThrow(() -> new RuntimeException("Service staff not found"));
            contract.setServiceStaff(staff);
        }

        // 3. [VALIDATE & UPDATE] Số điện thoại & Địa chỉ
        if (updateRequest.getContactPhone() != null && !updateRequest.getContactPhone().isBlank()) {
            String phone = updateRequest.getContactPhone();
            // Validate: 10 số, bắt đầu bằng 03, 05, 07, 08, 09
            if (!phone.matches("^(03|05|07|08|09)[0-9]{8}$")) {
                throw new IllegalArgumentException("Số điện thoại không hợp lệ (Phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09).");
            }
            contract.setContactPhone(phone);
        }

        if (updateRequest.getAddress() != null && !updateRequest.getAddress().isBlank()) {
            com.sep490.wcpms.entity.Address addr = contract.getAddress();
            if (addr == null) {
                addr = new com.sep490.wcpms.entity.Address();
                addr.setAddress(updateRequest.getAddress());
                addr = addressRepository.save(addr); // Lưu trước
                contract.setAddress(addr);
            } else {
                addr.setAddress(updateRequest.getAddress());
            }
        }

        // 4. Xử lý Ghi chú & Logic "Khách từ chối"
        String currentNotes = contract.getNotes();
        String newNoteInput = updateRequest.getNotes();

        // a. Xử lý thêm note mới (nếu có)
        if (newNoteInput != null && !newNoteInput.isBlank()) {
            if (currentNotes == null || currentNotes.isBlank()) {
                currentNotes = newNoteInput;
            } else {
                // Nối thêm vào dòng dưới kèm timestamp
                currentNotes = currentNotes + "\n[Service Staff " + LocalDate.now() + "]: " + newNoteInput;
            }
        }

//        // b. Xử lý trạng thái REJECTED -> Chuyển thành ĐÃ XỬ LÝ
//        if (contract.getContractStatus() == ContractStatus.APPROVED &&
//                currentNotes != null &&
//                currentNotes.contains("[Customer Reject Sign]")) {
//
//            // Đánh dấu hệ thống
//            currentNotes += "\n[System] Info updated on " + LocalDateTime.now();
//
//            // QUAN TRỌNG: Đổi tag để mất trạng thái Reject trên UI
//            // Thay "[Customer Reject Sign]" thành "[Rejection Handled]" (Giữ lịch sử nhưng đổi cờ)
//            currentNotes = currentNotes.replace("[Customer Reject Sign]", "[Rejection Handled]");
//        }

        contract.setNotes(currentNotes);
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
        Integer currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            return contractRepository.findByServiceStaffAndStatusAndKeyword(currentUserId, ContractStatus.DRAFT, keyword, pageable)
                    .map(this::convertToDTO);
        }
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

        // Tự động gán Nhân viên Dịch vụ hiện tại nếu chưa gán
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
        Integer currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            return contractRepository.findByServiceStaffAndStatusAndKeyword(currentUserId, ContractStatus.PENDING_SURVEY_REVIEW, keyword, pageable)
                    .map(this::convertToDTO);
        }
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

        // === THÔNG BÁO CHO ADMIN KHI SERVICE STAFF "TẠO HD" CHO GUEST ===
        if (updated.getCustomer() == null) {
            try {
                boolean exists = internalNotificationRepository.existsByReferenceIdAndReferenceTypeAndRecipientRole(
                        updated.getId(),
                        InternalNotification.NotificationType.GUEST_CONTRACT_CREATED,
                        "ADMIN"
                );

                if (!exists) {
                    String guestName = "Khách hàng";
                    String rawNote = updated.getNotes();
                    if (rawNote != null && rawNote.contains("KHÁCH:")) {
                        try {
                            int start = rawNote.indexOf("KHÁCH:") + 6;
                            int end = rawNote.indexOf("|", start);
                            if (end == -1) end = rawNote.indexOf("\n", start);
                            if (end == -1) end = rawNote.length();
                            String extractedName = rawNote.substring(start, end).trim();
                            if (!extractedName.isEmpty()) guestName = extractedName;
                        } catch (Exception ignored) {
                            // keep default
                        }
                    }

                    internalNotificationService.createNotification(
                            null,
                            "ADMIN",
                            "HĐ đã được tạo cho Guest",
                            "Bên Dịch vụ đã tạo HĐ cấp nước cho " + guestName + ". Vui lòng kiểm tra và tạo tài khoản.",
                            updated.getId(),
                            InternalNotification.NotificationType.GUEST_CONTRACT_CREATED
                    );
                }
            } catch (Exception e) {
                log.error("Failed to create ADMIN notification for guest contract created (contractId={})", updated.getId(), e);
            }
        }
        // ============================================================

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
        Integer currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            return contractRepository.findByServiceStaffAndStatusAndKeyword(currentUserId, ContractStatus.APPROVED, keyword, pageable)
                    .map(this::convertToDTO);
        }
        return contractRepository.findByStatusAndKeyword(ContractStatus.APPROVED, keyword, pageable)
                .map(this::convertToDTO);
    }

    // === Quản lý hợp đồng ACTIVE ===

    @Override
    public Page<ServiceStaffContractDTO> getActiveContracts(String keyword, Pageable pageable) {
        Integer currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            return contractRepository.findByServiceStaffAndStatusAndKeyword(currentUserId, ContractStatus.ACTIVE, keyword, pageable)
                    .map(this::convertToDTO);
        }
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

        //Chỉ cho phép gia hạn EXPIRED (Hết hạn)
        if (contract.getContractStatus() != ContractStatus.EXPIRED) {
            throw new RuntimeException("Only EXPIRED contracts can be renewed. Current status: " + contract.getContractStatus());
        }

        // Cập nhật ngày kết thúc mới
        if (renewRequest.getEndDate() != null) {
            // Kiểm tra: Ngày kết thúc mới phải sau ngày hiện tại
            if (renewRequest.getEndDate().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("New end date must be in the future.");
            }
            contract.setEndDate(renewRequest.getEndDate());
        } else {
            throw new IllegalArgumentException("End date is required for renewal");
        }

        //Chuyển trạng thái trở lại ACTIVE sau khi gia hạn thành công
        contract.setContractStatus(ContractStatus.ACTIVE);

        Contract updated = contractRepository.save(contract);
        // Ghi log
        try {
            Integer currentUserId = getCurrentUserId();
            Account currentUser = null;
            if (currentUserId != null) {
                currentUser = accountRepository.findById(currentUserId).orElse(null);
            }

            ActivityLog log = new ActivityLog();
            log.setSubjectType("CONTRACT");
            log.setSubjectId(updated.getContractNumber() != null ? updated.getContractNumber() : String.valueOf(updated.getId()));
            log.setAction("CONTRACT_RENEWED");

            if (currentUser != null) {
                log.setActorType("STAFF");
                log.setActorId(currentUser.getId());
                log.setActorName(currentUser.getFullName());
                log.setInitiatorType("STAFF");
                log.setInitiatorId(currentUser.getId());
                log.setInitiatorName(currentUser.getFullName());
            } else {
                log.setActorType("SYSTEM");
            }

            activityLogService.save(log);
        } catch (Exception e) {}
        return convertToDTO(updated);
    }

    // === THÊM HÀM MỚI ===
    @Override
    @Transactional
    public void scanAndExpireContracts() {
        LocalDate today = LocalDate.now();
        // Tìm tất cả hợp đồng ACTIVE mà ngày kết thúc < hôm nay
        List<Contract> expiredContracts = contractRepository.findByContractStatusAndEndDateBefore(ContractStatus.ACTIVE, today);

        if (expiredContracts.isEmpty()) {
            return;
        }

        log.info("Found {} contracts to expire.", expiredContracts.size());

        for (Contract c : expiredContracts) {
            c.setContractStatus(ContractStatus.EXPIRED);

            // Ghi log hệ thống
            try {
                ActivityLog log = new ActivityLog();
                log.setSubjectType("CONTRACT");
                log.setSubjectId(c.getContractNumber());
                log.setAction("AUTO_EXPIRED");
                log.setActorType("SYSTEM");
                log.setPayload("Contract expired on " + today);
                activityLogService.save(log);
            } catch (Exception e) {
                log.error("Failed to save activity log for expired contract " + c.getId());
            }
        }

        contractRepository.saveAll(expiredContracts);
    }

//    //LOGIC TẠM NGƯNG
//    @Override
//    @Transactional
//    public ServiceStaffContractDTO suspendContract(Integer contractId, String reason) {
//        Contract contract = contractRepository.findById(contractId)
//                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));
//
//        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
//            throw new IllegalStateException("Only ACTIVE contracts can be suspended. Current: " + contract.getContractStatus());
//        }
//
//        contract.setContractStatus(ContractStatus.SUSPENDED);
//        if (reason != null && !reason.isBlank()) {
//            String existing = contract.getNotes();
//            contract.setNotes((existing == null ? "" : existing + "\n") + "[Lý do tạm ngưng]: " + reason);
//        }
//
//        Contract updated = contractRepository.save(contract);
//        return convertToDTO(updated);
//    }
//
//    //LOGIC KÍCH HOẠT LẠI
//    @Override
//    @Transactional
//    public ServiceStaffContractDTO reactivateContract(Integer contractId) {
//        Contract contract = contractRepository.findById(contractId)
//                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));
//
//        if (contract.getContractStatus() != ContractStatus.SUSPENDED) {
//            throw new IllegalStateException("Only SUSPENDED contracts can be reactivated. Current: " + contract.getContractStatus());
//        }
//
//        contract.setContractStatus(ContractStatus.ACTIVE);
//        // Có thể thêm log vào notes nếu cần
//        // String existing = contract.getNotes();
//        // contract.setNotes((existing == null ? "" : existing + "\n") + "[Reactivate]: Activated on " + LocalDate.now());
//
//        Contract updated = contractRepository.save(contract);
//        return convertToDTO(updated);
//    }

//    @Override
//    public ServiceStaffContractDTO terminateContract(Integer contractId, String reason) {
//        Contract contract = contractRepository.findById(contractId)
//                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));
//
//        // Chỉ cho phép hủy hợp đồng ACTIVE
//        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
//            throw new RuntimeException("Only ACTIVE contracts can be terminated. Current status: " + contract.getContractStatus());
//        }
//
//        // Chuyển trạng thái sang TERMINATED
//        contract.setContractStatus(ContractStatus.TERMINATED);
//        contract.setEndDate(java.time.LocalDate.now());
//
//        if (reason != null && !reason.isBlank()) {
//            contract.setNotes(reason);
//        }
//
//        Contract updated = contractRepository.save(contract);
//        return convertToDTO(updated);
//    }

    private ServiceStaffContractDTO convertToDTO(Contract c) {
        ServiceStaffContractDTO dto = new ServiceStaffContractDTO();
        dto.setId(c.getId());
        dto.setContractNumber(c.getContractNumber());
        dto.setContractStatus(c.getContractStatus() != null ? c.getContractStatus().name() : null);
        dto.setStartDate(c.getStartDate());
        dto.setEndDate(c.getEndDate());
        dto.setInstallationDate(c.getInstallationDate());
        dto.setEstimatedCost(c.getEstimatedCost());
        dto.setContractValue(c.getContractValue());
        dto.setPaymentMethod(c.getPaymentMethod() != null ? c.getPaymentMethod().name() : null);
        dto.setNotes(c.getNotes());

        // --- XỬ LÝ QUAN TRỌNG: GUEST vs CUSTOMER ---
        if (c.getCustomer() != null) {
            // >>> TRƯỜNG HỢP A: Đã là Customer (Có tài khoản)
            dto.setCustomerId(c.getCustomer().getId());
            dto.setCustomerName(c.getCustomer().getCustomerName());
            dto.setCustomerCode(c.getCustomer().getCustomerCode());

            // Lấy SĐT từ Account của Customer
            if (c.getCustomer().getAccount() != null) {
                dto.setContactPhone(c.getCustomer().getAccount().getPhone());
            }

            // Lấy địa chỉ từ Customer (hoặc địa chỉ lắp đặt riêng nếu có)
            if (c.getAddress() != null && c.getAddress().getAddress() != null) {
                dto.setAddress(c.getAddress().getAddress());
            } else {
                dto.setAddress(c.getCustomer().getAddress());
            }

            dto.setIsGuest(false);
        } else {
            // >>> TRƯỜNG HỢP B: GUEST (Khách vãng lai)
            dto.setIsGuest(true);
            dto.setCustomerCode(null); // Guest không có mã KH

            // 1. Lấy SĐT Guest (Lưu trực tiếp trên Contract)
            dto.setContactPhone(c.getContactPhone());

            // 2. Xử lý Tên từ Notes (Logic: "KHÁCH: Tên | Ghi chú")
            String rawNotes = c.getNotes();
            if (rawNotes != null && !rawNotes.isEmpty()) {
                if (rawNotes.contains("|")) {
                    String[] parts = rawNotes.split("\\|");
                    String namePart = parts[0].trim();
                    // Loại bỏ chữ "KHÁCH:" để lấy tên sạch
                    dto.setCustomerName(namePart.replace("KHÁCH:", "").trim());
                } else {
                    // Nếu không đúng format thì lấy tạm cả chuỗi
                    dto.setCustomerName(rawNotes);
                }
            } else {
                dto.setCustomerName("Khách vãng lai");
            }

            // 3. Xử lý Địa chỉ (Lấy từ bảng Address linked với Contract)
            if (c.getAddress() != null) {
                String displayAddress = c.getAddress().getAddress();
                // Nếu trường address full bị null, tự ghép từ Street/Ward/District
                if (displayAddress == null || displayAddress.isEmpty()) {
                    String street = c.getAddress().getStreet() != null ? c.getAddress().getStreet() : "";
                    String ward = c.getAddress().getWard() != null ? c.getAddress().getWard().getWardName() : "";
                    String dist = c.getAddress().getWard() != null ? c.getAddress().getWard().getDistrict() : "";
                    displayAddress = String.format("%s, %s, %s", street, ward, dist)
                            .replace("null", "")
                            .replaceAll("^, |^, |, $", "");
                }
                dto.setAddress(displayAddress);
            }
        }
        // ----------------------------------------------

        dto.setSurveyDate(c.getSurveyDate());
        dto.setTechnicalDesign(c.getTechnicalDesign());

        // --- MAP STAFF ---
        if (c.getServiceStaff() != null) {
            dto.setServiceStaffId(c.getServiceStaff().getId());
            dto.setServiceStaffName(c.getServiceStaff().getFullName());
        }
        if (c.getTechnicalStaff() != null) {
            dto.setTechnicalStaffId(c.getTechnicalStaff().getId());
            dto.setTechnicalStaffName(c.getTechnicalStaff().getFullName());
        }

        // --- MAP PRICE TYPE ---
        if (c.getContractUsageDetails() != null && !c.getContractUsageDetails().isEmpty()) {
            ContractUsageDetail firstUsageDetail = c.getContractUsageDetails().get(0);
            if (firstUsageDetail != null && firstUsageDetail.getPriceType() != null) {
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

    // === TRIỂN KHAI 3 HÀM MỚI (BƯỚC 2) - ĐÃ SỬA WORKLOAD ===

    @Override
    @Transactional(readOnly = true)
    public List<AccountDTO> getAvailableTechStaff() {
        // Use repository query that returns AccountDTO with workload precomputed
        try {
            List<AccountDTO> dtos = accountRepository.findTechnicalStaffWithWorkload();
            if (dtos != null) return dtos;
        } catch (Exception ignored) {
            // fallback to simple list
        }
        return accountRepository.findByRole_RoleName(Role.RoleName.TECHNICAL_STAFF)
                .stream()
                .map(acc -> new AccountDTO(acc.getId(), acc.getFullName()))
                .collect(Collectors.toList());
    }

    // === CẬP NHẬT HÀM NÀY (Bước 4) ===
    @Override
    @Transactional(readOnly = true)
    public Page<SupportTicketDTO> getSupportTickets(Integer staffId, List<String> typeStrings, String keyword, Pageable pageable) {

        // 1. Xử lý danh sách Type (String -> Enum)
        List<CustomerFeedback.FeedbackType> types = null;
        if (typeStrings != null && !typeStrings.isEmpty()) {
            types = typeStrings.stream()
                    .map(s -> {
                        try {
                            return CustomerFeedback.FeedbackType.valueOf(s.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .toList();

            if (types.isEmpty()) types = null; // Nếu convert lỗi hết thì coi như lấy tất cả
        }

        // 2. Xử lý Keyword (lowercase, trim, thêm %)
        String searchKeyword = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            searchKeyword = keyword.trim().toLowerCase();
        }

        // 3. Gọi Repository
        Page<CustomerFeedback> tickets = customerFeedbackRepository.findAssignedTickets(staffId, types, searchKeyword, pageable);

        // 4. Map sang DTO
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
        return customerRepository.findSimpleList();
    }
    // --- HẾT PHẦN THÊM ---

    // --- TRIỂN KHAI HÀM MỚI ---
    @Override
    @Transactional(readOnly = true)
    public List<CustomerMeterDTO> getCustomerActiveMetersByCustomerId(Integer customerId) {
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
//        if (installContract.getCustomer() == null) {
//            throw new IllegalStateException("Contract missing customer");
//        }
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

        // === THÔNG BÁO CHO ADMIN ===
        log.info(">>>> CHECKING GUEST NOTIFICATION CONDITION: Customer is {}",
                installContract.getCustomer() == null ? "NULL (Is Guest)" : "NOT NULL");
        if (installContract.getCustomer() == null) {
            // 1. Lấy tên Guest từ Note
            String guestName = "Khách hàng"; // Mặc định
            String rawNote = installContract.getNotes();

            if (rawNote != null && rawNote.contains("KHÁCH:")) {
                try {
                    int start = rawNote.indexOf("KHÁCH:") + 6; // Độ dài của "KHÁCH:" là 6
                    int end = rawNote.indexOf("|", start);

                    // Nếu không có dấu |, thử tìm xuống dòng
                    if (end == -1) end = rawNote.indexOf("\n", start);

                    // Nếu vẫn không có, lấy đến hết chuỗi
                    if (end == -1) end = rawNote.length();

                    // Cắt chuỗi và trim
                    String extractedName = rawNote.substring(start, end).trim();
                    if (!extractedName.isEmpty()) {
                        guestName = extractedName;
                    }
                } catch (Exception e) {
                    // Nếu lỗi format, giữ nguyên mặc định là "Khách hàng"
                    log.warn("Failed to extract guest name from note: {}", e.getMessage());
                }
            }

            // 2. Tạo thông báo với nội dung mới
            try {
                internalNotificationService.createNotification(
                        null,
                        "ADMIN",
                        "HĐ đã được tạo cho Guest",
                        "Bên Dịch vụ đã tạo HĐ cấp nước cho " + guestName + ". Vui lòng kiểm tra và tạo tài khoản.",
                        installContract.getId(),
                        InternalNotification.NotificationType.GUEST_CONTRACT_CREATED
                );
                log.info(">>>> NOTIFICATION SENT SUCCESSFULLY!");
            } catch (Exception e) {
                log.error(">>>> FAILED TO SEND NOTIFICATION: ", e);
            }
        }
        // =====================================

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

//        // xử lý khi gửi lại (khách từ chối ký)
//        // Nếu có dòng "[Customer Reject Sign]" trong notes, ta sẽ:
//        // 1. Xóa dòng đó đi để ghi chú sạch sẽ
//        // 2. Hoặc ghi đè thêm dòng mới "[Service Staff] Resent for signing"
//        // Ở đây mình chọn cách ghi log thêm để dễ trace
//        if (contract.getNotes() != null && contract.getNotes().contains("[Customer Reject Sign]")) {
//            String newNote = "\n[Service Staff] Adjusted and Resent for signing at " + LocalDateTime.now();
//            contract.setNotes(contract.getNotes() + newNote);
//        }
        contract.setContractStatus(ContractStatus.PENDING_CUSTOMER_SIGN);
        Contract updated = contractRepository.save(contract);

        // Ghi Log
        try {
            Integer currentUserId = getCurrentUserId();
            Account currentUser = null;
            if (currentUserId != null) {
                currentUser = accountRepository.findById(currentUserId).orElse(null);
            }

            ActivityLog log = new ActivityLog();
            log.setSubjectType("CONTRACT");
            log.setSubjectId(updated.getContractNumber()); // Lưu contract number
            log.setAction("SENT_TO_CUSTOMER_FOR_SIGN");

            if (currentUser != null) {
                log.setActorType("STAFF");
                log.setActorId(currentUser.getId());
                log.setActorName(currentUser.getFullName());
                log.setInitiatorType("STAFF");
                log.setInitiatorId(currentUser.getId());
                log.setInitiatorName(currentUser.getFullName());
            } else {
                log.setActorType("SYSTEM");
            }
            activityLogService.save(log);
        } catch (Exception e) {}
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
        // Persist activity log: service staff sent to installation
        try {
            ActivityLog log = new ActivityLog();
            log.setSubjectType("CONTRACT");
            String subj = updated.getContractNumber() != null ? updated.getContractNumber() : String.valueOf(updated.getId());
            log.setSubjectId(subj);
            log.setAction("SENT_TO_INSTALLATION");
            if (updated.getServiceStaff() != null) {
                log.setActorType("STAFF");
                log.setActorId(updated.getServiceStaff().getId());
                log.setActorName(updated.getServiceStaff().getFullName());
                log.setInitiatorType("STAFF");
                log.setInitiatorId(updated.getServiceStaff().getId());
                log.setInitiatorName(updated.getServiceStaff().getFullName());
            } else {
                log.setActorType("SYSTEM");
            }
            activityLogService.save(log);
        } catch (Exception e) {
            // swallow to not affect main flow
        }
        return convertToDTO(updated);
    }


    @Override
    @Transactional(readOnly = true)
    public Page<ServiceStaffContractDTO> getPendingSignContracts(String keyword, Pageable pageable) {
        Integer currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            return contractRepository.findByServiceStaffAndStatusAndKeyword(currentUserId, ContractStatus.PENDING_SIGN, keyword, pageable)
                    .map(this::convertToDTO);
        }
        return contractRepository.findByStatusAndKeyword(ContractStatus.PENDING_SIGN, keyword, pageable)
                .map(this::convertToDTO);
    }

    // === CẬP NHẬT HÀM getAnnulRequests ===
    @Override
    @Transactional(readOnly = true)
    public Page<ContractAnnulTransferRequestDTO> getAnnulRequests(String keyword, Pageable pageable, List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatuses) {
        Integer currentUserId = getCurrentUserId();
        ContractAnnulTransferRequest.RequestType type = ContractAnnulTransferRequest.RequestType.ANNUL;

        if (approvalStatuses != null && approvalStatuses.isEmpty()) approvalStatuses = null;

        // Xử lý keyword: trim khoảng trắng (nếu có)
        String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        if (currentUserId != null) {
            return contractAnnulTransferRequestRepository
                    .findByStaffAndStatusInAndTypeAndKeyword(currentUserId, approvalStatuses, type, searchKeyword, pageable)
                    .map(this::convertToAnnulTransferDTO);
        } else {
            return contractAnnulTransferRequestRepository
                    .findByApprovalStatusInAndTypeAndKeyword(approvalStatuses, type, searchKeyword, pageable)
                    .map(this::convertToAnnulTransferDTO);
        }
    }

    // === CẬP NHẬT HÀM getTransferRequests ===
    @Override
    @Transactional(readOnly = true)
    public Page<ContractAnnulTransferRequestDTO> getTransferRequests(String keyword, Pageable pageable, List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatuses) {
        Integer currentUserId = getCurrentUserId();
        ContractAnnulTransferRequest.RequestType type = ContractAnnulTransferRequest.RequestType.TRANSFER;

        if (approvalStatuses != null && approvalStatuses.isEmpty()) approvalStatuses = null;

        String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        if (currentUserId != null) {
            return contractAnnulTransferRequestRepository
                    .findByStaffAndStatusInAndTypeAndKeyword(currentUserId, approvalStatuses, type, searchKeyword, pageable)
                    .map(this::convertToAnnulTransferDTO);
        } else {
            return contractAnnulTransferRequestRepository
                    .findByApprovalStatusInAndTypeAndKeyword(approvalStatuses, type, searchKeyword, pageable)
                    .map(this::convertToAnnulTransferDTO);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ContractAnnulTransferRequestDTO getAnnulTransferRequestDetail(Integer requestId) {
        ContractAnnulTransferRequest request = contractAnnulTransferRequestRepository.findWithRelationsById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu với ID: " + requestId));
        return convertToAnnulTransferDTO(request);
    }

    @Override
    @Transactional
    public ContractAnnulTransferRequestDTO approveAnnulTransferRequest(Integer requestId) {
        // Logic duyệt: Chuyển trạng thái sang APPROVED, ngày duyệt là hôm nay
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
            // ignore
        }

        return contractAnnulTransferRequestService.updateApproval(requestId, dto);
    }

    @Override
    @Transactional
    public ContractAnnulTransferRequestDTO rejectAnnulTransferRequest(Integer requestId, String reason) {
        // Logic từ chối: Chuyển trạng thái sang REJECTED, lưu lý do vào rejectionReason
        ContractAnnulTransferRequestUpdateDTO dto = ContractAnnulTransferRequestUpdateDTO.builder()
                .approvalStatus(ContractAnnulTransferRequest.ApprovalStatus.REJECTED)
                .approvalDate(LocalDate.now())
                // --- SỬA Ở ĐÂY: Lưu vào rejectionReason thay vì notes ---
                .rejectionReason(reason)
                // --------------------------------------------------------
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
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        dto.setAttachedEvidence(request.getAttachedEvidence());
        if (request.getContract() != null) {
            dto.setContractId(request.getContract().getId());
            dto.setContractNumber(request.getContract().getContractNumber());
        }
        if (request.getRequestedBy() != null) {
            dto.setRequesterId(request.getRequestedBy().getId());
            dto.setRequesterName(request.getRequestedBy().getFullName());
        }
        if (request.getFromCustomer() != null) {
            dto.setFromCustomerId(request.getFromCustomer().getId());
            dto.setFromCustomerName(request.getFromCustomer().getCustomerName());
        } else {
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

        // --- Thêm trường cho TRANSFER/ANNUL UI (codes/phones/addresses) ---
        try {
            Customer from = request.getFromCustomer();
            if (from == null && request.getContract() != null) {
                from = request.getContract().getCustomer();
            }
            Customer to = request.getToCustomer();

            if (from != null) {
                dto.setFromCustomerCode(from.getCustomerCode());
                // phone: prefer Account.phone, fallback customer.phone (if exists), then contract.contactPhone
                String phone = null;
                if (from.getAccount() != null) phone = from.getAccount().getPhone();
                if ((phone == null || phone.isBlank())) {
                    try {
                        // some projects store phone directly on customer
                        var m = from.getClass().getMethod("getPhone");
                        Object v = m.invoke(from);
                        if (v != null) phone = String.valueOf(v);
                    } catch (Exception ignored) {
                    }
                }
                if ((phone == null || phone.isBlank()) && request.getContract() != null) {
                    phone = request.getContract().getContactPhone();
                }
                dto.setFromCustomerPhone(phone);

                // address: prefer customer.address, fallback contract.address.address
                String addr = from.getAddress();
                if ((addr == null || addr.isBlank()) && request.getContract() != null && request.getContract().getAddress() != null) {
                    addr = request.getContract().getAddress().getAddress();
                }
                dto.setFromCustomerAddress(addr);
            }

            if (to != null) {
                dto.setToCustomerCode(to.getCustomerCode());
                String phone = null;
                if (to.getAccount() != null) phone = to.getAccount().getPhone();
                if ((phone == null || phone.isBlank())) {
                    try {
                        var m = to.getClass().getMethod("getPhone");
                        Object v = m.invoke(to);
                        if (v != null) phone = String.valueOf(v);
                    } catch (Exception ignored) {
                    }
                }
                dto.setToCustomerPhone(phone);

                String addr = to.getAddress();
                dto.setToCustomerAddress(addr);
            }
        } catch (Exception ex) {
            // don't break list API because of mapping edge cases
            log.debug("convertToAnnulTransferDTO: failed to enrich from/to contact info. requestId={}", request.getId(), ex);
        }

        return dto;
    }
}
