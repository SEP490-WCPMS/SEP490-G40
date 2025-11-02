package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.FeedbackCreateRequestDTO;
import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerFeedback;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.SupportTicketMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerFeedbackRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.CustomerFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final SupportTicketMapper supportTicketMapper;

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
        ticket.setFeedbackType(CustomerFeedback.FeedbackType.SUPPORT_REQUEST); // Luôn là SUPPORT
        ticket.setStatus(CustomerFeedback.Status.PENDING); // Luôn là PENDING
        ticket.setSubmittedDate(LocalDateTime.now());
        ticket.setRequestedBy(requestedBy); // Gán người yêu cầu (có thể là KH hoặc NV)
        // assignedTo (NV Kỹ thuật) sẽ là null, chờ Service Staff gán ở Bước 2

        CustomerFeedback savedTicket = customerFeedbackRepository.save(ticket);

        return supportTicketMapper.toDto(savedTicket);
    }
}
