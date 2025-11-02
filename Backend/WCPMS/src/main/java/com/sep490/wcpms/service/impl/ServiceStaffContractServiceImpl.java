package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import com.sep490.wcpms.entity.Contract.PaymentMethod;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.repository.ServiceStaffContractRepository;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.sep490.wcpms.mapper.ContractMapper; // <-- Cần import
import com.sep490.wcpms.mapper.SupportTicketMapper;
import com.sep490.wcpms.repository.CustomerFeedbackRepository;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.entity.CustomerFeedback; // <-- THÊM DÒNG NÀY
import com.sep490.wcpms.entity.ContractUsageDetail; // <-- THÊM DÒNG NÀY
import com.sep490.wcpms.repository.CustomerRepository; // <-- THÊM IMPORT NÀY

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceStaffContractServiceImpl implements ServiceStaffContractService {

    private final ServiceStaffContractRepository contractRepository;
    private final AccountRepository accountRepository; // optional, used if you assign serviceStaff or technicalStaff
    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final SupportTicketMapper supportTicketMapper;
    private final CustomerRepository customerRepository;
    // Giả định bạn có ContractMapper được inject nếu convertToDTO cần
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

        // Update only allowed fields (null-safe)
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
        // If service staff id provided and exists, set (optional)
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
        return convertToDTO(contract);
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

        // Tìm và gán nhân viên kỹ thuật
        Account technicalStaff = accountRepository.findById(technicalStaffId)
                .orElseThrow(() -> new RuntimeException("Technical staff not found with id: " + technicalStaffId));
        

        // Kiểm tra vai trò của account (tùy chọn nhưng nên có)
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
    public ServiceStaffContractDTO approveSurveyReport(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép duyệt hợp đồng có status PENDING_SURVEY_REVIEW
        if (contract.getContractStatus() != ContractStatus.PENDING_SURVEY_REVIEW) {
            throw new RuntimeException("Cannot approve contract not in PENDING_SURVEY_REVIEW status. Current status: " + contract.getContractStatus());
        }

        contract.setContractStatus(ContractStatus.APPROVED);
        Contract updated = contractRepository.save(contract);
        return convertToDTO(updated);
    }

    @Override
    public Page<ServiceStaffContractDTO> getApprovedContracts(String keyword, Pageable pageable) {
        return contractRepository.findByStatusAndKeyword(ContractStatus.APPROVED, keyword, pageable)
                .map(this::convertToDTO);
    }

    // === ACTIVE Contract Management ===

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

        // Update ngày kết thúc mới
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

    @Override
    public ServiceStaffContractDTO terminateContract(Integer contractId, String reason) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + contractId));

        // Chỉ cho phép hủy hợp đồng ACTIVE
        if (contract.getContractStatus() != ContractStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE contracts can be terminated. Current status: " + contract.getContractStatus());
        }

        // Chuyển sang TERMINATED
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
        // dto.setSurveyDate(c.getSurveyDate());
        // dto.setTechnicalDesign(c.getTechnicalDesign());

        // Lấy priceTypeName từ ContractUsageDetail
        if (c.getContractUsageDetails() != null && !c.getContractUsageDetails().isEmpty()) {
            // Lấy phần tử đầu tiên từ danh sách (nếu có nhiều, lấy cái đầu)
            var firstUsageDetail = c.getContractUsageDetails().get(0);
            if (firstUsageDetail != null && firstUsageDetail.getPriceType() != null) { // Thêm kiểm tra null
                dto.setPriceTypeName(firstUsageDetail.getPriceType().getTypeName());
            }
        }

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

}