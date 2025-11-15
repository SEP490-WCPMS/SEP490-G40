package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.FeedbackCreateRequestDTO;
import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.dto.CustomerMeterDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerFeedback;
import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.SupportTicketMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerFeedbackRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.WaterMeterRepository;
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

@Service
@RequiredArgsConstructor
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final SupportTicketMapper supportTicketMapper;
    private final WaterMeterRepository waterMeterRepository;


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

        CustomerFeedback savedTicket = customerFeedbackRepository.save(ticket);

        return supportTicketMapper.toDto(savedTicket);
    }

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách ticket của Khách hàng đang đăng nhập.
     */
    @Override
    @Transactional(readOnly = true)
    public Page<SupportTicketDTO> getMyTickets(Integer customerAccountId, Pageable pageable) {
        // 1. Tìm hồ sơ Customer từ Account ID
        Customer customer = customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng cho tài khoản: " + customerAccountId));

        // 2. Lấy danh sách ticket của Customer đó
        Page<CustomerFeedback> tickets = customerFeedbackRepository.findByCustomer_Id(customer.getId(), pageable);

        // 3. Map sang DTO
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
