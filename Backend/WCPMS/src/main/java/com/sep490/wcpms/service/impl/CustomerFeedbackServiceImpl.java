package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.FeedbackCreateRequestDTO;
import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.dto.CustomerMeterDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.SupportTicketMapper;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.CustomerFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.exception.DuplicateResourceException;
import com.sep490.wcpms.exception.AccessDeniedException; // <-- THÊM IMPORT
import org.springframework.data.domain.Page; // <-- THÊM IMPORT
import org.springframework.data.domain.Pageable; // <-- THÊM IMPORT

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final SupportTicketMapper supportTicketMapper;
    private final WaterMeterRepository waterMeterRepository;
    private final RoleRepository roleRepository;


    /**
     * Hàm helper: Tìm nhân viên Dịch vụ rảnh nhất và gán vào ticket
     */
    private void assignTicketToServiceStaff(CustomerFeedback ticket) {
        // 1. Lấy Role ID của SERVICE_STAFF
        Role serviceRole = roleRepository.findByRoleName(Role.RoleName.SERVICE_STAFF)
                .orElseThrow(() -> new RuntimeException("Role SERVICE_STAFF chưa được định nghĩa trong DB"));

        // 2. Tìm nhân viên ít việc nhất
        // Nếu không có ai (ví dụ cty chưa tuyển Service Staff), ta có thể để assigned_to = NULL (PENDING chung)
        accountRepository.findServiceStaffWithLeastTickets(serviceRole.getId())
                .ifPresentOrElse(
                        staff -> {
                            ticket.setAssignedTo(staff); // Gán vào cột assigned_to
                            // Có thể thêm log: System.out.println("Auto-assigned ticket " + ticket.getFeedbackNumber() + " to " + staff.getUsername());
                        },
                        () -> {
                            // Trường hợp không tìm thấy nhân viên nào (có thể log warning)
                            System.err.println("WARNING: Không tìm thấy nhân viên Dịch vụ nào để gán ticket!");
                        }
                );
    }


    @Override
    @Transactional
    public SupportTicketDTO createTicketAsCustomer(FeedbackCreateRequestDTO dto, Integer customerAccountId) {
        // 1. Tìm Account của khách hàng
        Account customerAccount = accountRepository.findById(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản khách hàng không tìm thấy: " + customerAccountId));

        // Tìm Customer (hồ sơ) bằng hàm findByAccount_Id() và truyền ID
        Customer customer = customerRepository.findByAccount_Id(customerAccount.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ khách hàng không tìm thấy cho tài khoản: " + customerAccountId));
        // === HẾT PHẦN SỬA ===
        // 3. Gọi hàm tạo ticket chung
        return createTicket(dto, customer, customerAccount);
    }

    @Override
    @Transactional
    public SupportTicketDTO createTicketAsServiceStaff(FeedbackCreateRequestDTO dto, Integer serviceStaffId) {
        // 1. Tìm Account của NV Dịch vụ (người tạo)
        Account serviceStaff = accountRepository.findById(serviceStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản NV Dịch vụ không tìm thấy: " + serviceStaffId));

        // 2. Tìm Customer (hồ sơ) mà NV Dịch vụ chỉ định
        if (dto.getCustomerId() == null) {
            throw new IllegalArgumentException("CustomerId là bắt buộc khi NV Dịch vụ tạo ticket.");
        }
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ khách hàng không tìm thấy: " + dto.getCustomerId()));

        // 3. Gọi hàm tạo ticket chung
        return createTicket(dto, customer, serviceStaff);
    }

    /**
     * Hàm private xử lý logic tạo ticket chung (Bảng 20)
     * (ĐÃ CẬP NHẬT: Thêm logic Chống Spam)
     */
    private SupportTicketDTO createTicket(FeedbackCreateRequestDTO dto, Customer customer, Account requestedBy) {

        // 1. Chuyển đổi FeedbackType (Code cũ)
        CustomerFeedback.FeedbackType type;
        try {
            type = CustomerFeedback.FeedbackType.valueOf(dto.getFeedbackType().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            type = CustomerFeedback.FeedbackType.FEEDBACK;
        }

        WaterMeter meter = null; // Biến để lưu đồng hồ

        // 2. Cập nhật: Lấy WaterMeter (nếu có) (Code cũ)
        if (dto.getMeterId() != null) {
            meter = waterMeterRepository.findById(dto.getMeterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đồng hồ (WaterMeter) với ID: " + dto.getMeterId()));
        }

        // --- 3. LOGIC CHỐNG SPAM (MỚI) ---
        // Chỉ kiểm tra nếu là Yêu cầu Hỗ trợ VÀ có gán đồng hồ
        if (type == CustomerFeedback.FeedbackType.SUPPORT_REQUEST && meter != null) {

            // 3a. Định nghĩa các trạng thái "đang mở"
            List<CustomerFeedback.Status> openStatuses = List.of(
                    CustomerFeedback.Status.PENDING,
                    CustomerFeedback.Status.IN_PROGRESS
            );

            // 3b. Gọi hàm Repo mới
            boolean alreadyExists = customerFeedbackRepository.existsByWaterMeterAndStatusIn(meter, openStatuses);

            if (alreadyExists) {
                // 3c. Ném lỗi (409) với thông điệp bạn yêu cầu
                throw new DuplicateResourceException(
                        "Đơn hỗ trợ với mã đồng hồ [" + meter.getMeterCode() + "] của bạn đã tồn tại và đang được xử lý. " +
                                "Quý khách vui lòng kiên nhẫn chờ đợi."
                );
            }
        }
        // --- HẾT LOGIC MỚI ---

        // 4. (Code cũ) Tạo ticket
        CustomerFeedback ticket = new CustomerFeedback();
        String ticketNumber = "FB-" + System.currentTimeMillis();
        ticket.setFeedbackNumber(ticketNumber);
        ticket.setCustomer(customer);
        ticket.setDescription(dto.getDescription());
        ticket.setFeedbackType(type);
        ticket.setStatus(CustomerFeedback.Status.PENDING);
        ticket.setSubmittedDate(LocalDateTime.now());
        ticket.setRequestedBy(requestedBy);
        ticket.setWaterMeter(meter); // Gán đồng hồ (nếu có)

        // =================================================================
        // 4. [MỚI] TỰ ĐỘNG PHÂN BỔ CHO NHÂN VIÊN DỊCH VỤ (Load Balancing)
        // =================================================================

        // Chỉ tự động phân bổ nếu người tạo KHÔNG phải là nhân viên (tức là Khách hàng tạo)
        // Nếu nhân viên tự tạo ticket thì họ có thể tự assign cho mình hoặc để null tùy logic,
        // nhưng ở đây ta tập trung vào việc Khách hàng gửi đơn lên.
        if (requestedBy.getRole().getRoleName() == Role.RoleName.CUSTOMER) {
            // TRƯỜNG HỢP A: Khách hàng tự tạo
            // -> Hệ thống tự động tìm nhân viên rảnh nhất để chia việc (Auto Assign)
            assignTicketToServiceStaff(ticket);

        } else if (requestedBy.getRole().getRoleName() == Role.RoleName.SERVICE_STAFF) {
            // TRƯỜNG HỢP B: Nhân viên Service tạo hộ
            // -> Gán NGAY LẬP TỨC cho chính nhân viên đó ("Việc ai tạo người nấy làm")
            ticket.setAssignedTo(requestedBy);

            // (Tùy chọn: Nếu nhân viên tạo thì thường là họ đã tiếp nhận luôn,
            // nên có thể set status là IN_PROGRESS luôn thay vì PENDING)
            // ticket.setStatus(CustomerFeedback.Status.IN_PROGRESS);
        }

        // =================================================================

        CustomerFeedback savedTicket = customerFeedbackRepository.save(ticket);

        return supportTicketMapper.toDto(savedTicket);
    }

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách ticket của Khách hàng đang đăng nhập.
     */
    /**
     * Lấy danh sách ticket của Khách hàng đang đăng nhập.
     * ĐÃ SỬA: Thêm logic lọc theo status
     */
    @Override
    @Transactional(readOnly = true)
    public Page<SupportTicketDTO> getMyTickets(Integer customerAccountId, List<String> statusStrings, String keyword, Pageable pageable) {
        // 1. Tìm hồ sơ Customer
        Customer customer = customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng cho tài khoản: " + customerAccountId));

        // 2. Xử lý Status Filter
        List<CustomerFeedback.Status> targetStatuses = null;

        if (statusStrings != null && !statusStrings.isEmpty() && !statusStrings.contains("ALL")) {
            // Chỉ convert nếu KHÔNG PHẢI là "ALL"
            targetStatuses = statusStrings.stream()
                    .map(s -> {
                        try {
                            return CustomerFeedback.Status.valueOf(s.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            return null; // Bỏ qua giá trị lỗi
                        }
                    })
                    .filter(java.util.Objects::nonNull) // Lọc bỏ null
                    .collect(Collectors.toList());

            // Nếu sau khi lọc mà list rỗng (do toàn string sai), ta có thể để null để lấy hết,
            // hoặc để rỗng để không ra kết quả nào (tùy nghiệp vụ).
            // Ở đây tôi để logic: nếu filter sai thì coi như không tìm thấy gì khớp status đó.
            if (targetStatuses.isEmpty()) {
                // Tùy chọn: return Page.empty(); nếu muốn chặt chẽ
            }
        }
        // Lưu ý: Nếu statusStrings là "ALL" hoặc null, thì targetStatuses vẫn là null -> Query sẽ lấy tất cả trạng thái.

        // 3. Gọi Repository (Hàm mới viết ở Bước 1)
        // Trim keyword để xóa khoảng trắng thừa đầu đuôi
        String searchKeyword = (keyword != null) ? keyword.trim() : null;

        Page<CustomerFeedback> tickets = customerFeedbackRepository.searchMyTickets(
                customer.getId(),
                targetStatuses,
                searchKeyword,
                pageable
        );

        // 4. Map sang DTO
        return tickets.map(supportTicketMapper::toDto);
    }

    /**
     * Lấy chi tiết 1 ticket (xác thực đúng chủ sở hữu).
     */
    @Override
    @Transactional(readOnly = true)
    public SupportTicketDTO getMyTicketDetail(Integer customerAccountId, Integer ticketId) {
        // 1. Tìm hồ sơ Customer từ Account ID
        Customer customer = customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng cho tài khoản: " + customerAccountId));

        // 2. Lấy ticket bằng ID VÀ Customer ID (để bảo mật)
        CustomerFeedback ticket = customerFeedbackRepository.findByIdAndCustomer_Id(ticketId, customer.getId())
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy hoặc không có quyền truy cập Yêu cầu Hỗ trợ này."));

        // 3. Map sang DTO
        return supportTicketMapper.toDto(ticket);
    }
    // --- HẾT PHẦN THÊM ---

    // --- TRIỂN KHAI HÀM MỚI ---
    @Override
    @Transactional(readOnly = true)
    public List<CustomerMeterDTO> getCustomerActiveMeters(Integer customerAccountId) {
        // 1. Tìm hồ sơ Customer từ Account ID
        Customer customer = customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng cho tài khoản: " + customerAccountId));

        // 2. Gọi hàm query mới trong WaterMeterRepository
        return waterMeterRepository.findActiveMetersByCustomerId(customer.getId());
    }
    // --- HẾT PHẦN THÊM ---
}
