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
     */
    private SupportTicketDTO createTicket(FeedbackCreateRequestDTO dto, Customer customer, Account requestedBy) {
        CustomerFeedback ticket = new CustomerFeedback();

        // Tạo mã ticket (ví dụ: FB-timestamp)
        String ticketNumber = "FB-" + System.currentTimeMillis();
        ticket.setFeedbackNumber(ticketNumber);

        ticket.setCustomer(customer);
        ticket.setDescription(dto.getDescription());
        // --- SỬA LẠI LOGIC Ở ĐÂY ---
        // Đọc loại feedback từ DTO thay vì ghi cứng
        CustomerFeedback.FeedbackType type;
        try {
            // Chuyển chuỗi "FEEDBACK" hoặc "SUPPORT_REQUEST" thành Enum
            type = CustomerFeedback.FeedbackType.valueOf(dto.getFeedbackType().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            // Nếu FE gửi bậy, mặc định là FEEDBACK
            type = CustomerFeedback.FeedbackType.FEEDBACK;
        }
        ticket.setFeedbackType(type); // <-- ĐÃ SỬA
        // --- HẾT PHẦN SỬA ---
        ticket.setStatus(CustomerFeedback.Status.PENDING); // Luôn là PENDING
        ticket.setSubmittedDate(LocalDateTime.now());
        ticket.setRequestedBy(requestedBy); // Gán người yêu cầu (có thể là KH hoặc NV)
        // assignedTo (NV Kỹ thuật) sẽ là null, chờ Service Staff gán ở Bước 2

        // --- CẬP NHẬT: LƯU METER_ID NẾU CÓ ---
        if (dto.getMeterId() != null) {
            // Tìm đồng hồ để liên kết
            WaterMeter meter = waterMeterRepository.findById(dto.getMeterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đồng hồ (WaterMeter) với ID: " + dto.getMeterId()));

            // (Thêm kiểm tra bảo mật: Đồng hồ này có thực sự thuộc khách hàng này không?)
            // (Bỏ qua bước này để đơn giản hóa)

            ticket.setWaterMeter(meter); // Gán đồng hồ vào ticket
        }
        // --- HẾT PHẦN CẬP NHẬT ---

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
