package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CustomerResponseDTO;
import com.sep490.wcpms.dto.GuestRequestResponseDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final ContractRepository contractRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoleRepository roleRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final CustomerNotificationSmsService customerNotificationSmsService;

    @Override
    public List<CustomerResponseDTO> getAllCustomers() {
        // 1. Lấy toàn bộ dữ liệu từ bảng CUSTOMERS (đã JOIN account để tránh lazy loading)
        List<Customer> customers = customerRepository.findAllWithAccount();

        return customers.stream().map(cust -> {
            Account acc = cust.getAccount();

            return CustomerResponseDTO.builder()
                    .customerId(cust.getId())
                    .accountId(acc != null ? acc.getId() : null)
                    .customerCode(cust.getCustomerCode())
                    .fullName(cust.getCustomerName())
                    .address(cust.getAddress())
                    .phone(cust.getContactPersonPhone() != null ? cust.getContactPersonPhone() : (acc != null ? acc.getPhone() : ""))
                    .email(acc != null ? acc.getEmail() : "")
                    .status(acc != null && acc.getStatus() != null ? acc.getStatus() : 1)
                    .build();
        }).collect(Collectors.toList());
    }
    @Override
    public List<GuestRequestResponseDTO> getPendingGuestRequests() {
        // SỬA: Lấy các hợp đồng chưa có Customer và trạng thái là PENDING_SIGN_REVIEW hoặc APPROVED
        // Bạn cần đảm bảo Repository có hỗ trợ method này hoặc dùng @Query tương ứng
        List<Contract.ContractStatus> targetStatuses = Arrays.asList(
                Contract.ContractStatus.PENDING_SURVEY_REVIEW,
                Contract.ContractStatus.APPROVED
        );

        // Gọi hàm repository (Xem phần cập nhật Repository bên dưới)
        List<Contract> contracts = contractRepository.findByCustomerIsNullAndContractStatusIn(targetStatuses);

        return contracts.stream().map(this::mapToGuestDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approveGuestAndCreateAccount(Integer contractId) {
        // 1. Lấy hợp đồng
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại"));

        // SỬA: Kiểm tra trạng thái hợp lệ (PENDING_SIGN_REVIEW hoặc APPROVED)
        if (contract.getContractStatus() != Contract.ContractStatus.PENDING_SURVEY_REVIEW
                && contract.getContractStatus() != Contract.ContractStatus.APPROVED) {
            throw new IllegalStateException("Chỉ tạo tài khoản cho Guest khi hợp đồng đang chờ ký duyệt hoặc đã duyệt.");
        }

        if (contract.getCustomer() != null) {
            throw new IllegalArgumentException("Hợp đồng này đã có khách hàng.");
        }

        // 2. Trích xuất thông tin Guest
        String phone = contract.getContactPhone();
        if (phone == null || phone.isEmpty()) throw new IllegalArgumentException("Không tìm thấy SĐT Guest.");

        // Parse tên từ Note (Giả định format: "KHÁCH: [Tên]...") hoặc xử lý chuỗi
        String fullName = extractNameFromNote(contract.getNotes());
        String addressStr = contract.getAddress() != null ? contract.getAddress().getAddress() : "Chưa cập nhật";

        // 3. Tạo Account
        if (accountRepository.existsByUsername(phone)) {
            throw new IllegalArgumentException("SĐT này đã được đăng ký tài khoản khác.");
        }

        String rawPassword = generateRandomPassword(6); // Sinh mật khẩu 6 số
        Role customerRole = roleRepository.findByRoleName(Role.RoleName.CUSTOMER)
                .orElseThrow(() -> new RuntimeException("Role Customer not found"));

        Account account = new Account();
        account.setUsername(phone); // Username là SĐT
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setFullName(fullName);
        account.setPhone(phone);
        account.setRole(customerRole);
        account.setStatus(1); // Active
        // Generate Customer Code (copy logic từ AuthService)
        account.setCustomerCode("KH" + System.currentTimeMillis());

        Account savedAccount = accountRepository.save(account);

        // 4. Tạo Customer
        Customer customer = new Customer();
        customer.setAccount(savedAccount);
        customer.setCustomerName(fullName);
        customer.setCustomerCode(savedAccount.getCustomerCode());
        customer.setAddress(addressStr);
        // Link SĐT liên hệ
        customer.setContactPersonPhone(phone);

        Customer savedCustomer = customerRepository.save(customer);

        // 5. Cập nhật Address (nếu có) để trỏ về Customer mới
        if (contract.getAddress() != null) {
            Address addr = contract.getAddress();
            addr.setCustomer(savedCustomer);
            addressRepository.save(addr);
        }

        // 6. Cập nhật Contract
        contract.setCustomer(savedCustomer);
        contractRepository.save(contract);

        // Chuẩn bị thông tin chung dùng cho cả email & SMS
        String contractNumber = contract.getContractNumber() != null
                ? contract.getContractNumber()
                : String.valueOf(contract.getId());

        CustomerNotification notification = new CustomerNotification();
        notification.setCustomer(savedCustomer);
        notification.setInvoice(null);
        notification.setMessageType(CustomerNotification.CustomerNotificationMessageType.ACCOUNT_CREATED);
        notification.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.CONTRACT);
        notification.setRelatedId(contract.getId());
        notification.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);
        notification.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
        notification.setCreatedAt(LocalDateTime.now());

        String subject = "Tài khoản khách hàng cấp nước đã được tạo";
        String body = String.format(
                "Kính gửi %s,\n\n" +
                        "Hệ thống cấp nước Phú Thọ đã tạo tài khoản khách hàng cho hợp đồng số %s.\n\n" +
                        "Thông tin đăng nhập:\n" +
                        "- Số điện thoại: %s\n" +
                        "- Mật khẩu tạm thời: %s\n\n" +
                        "Vui lòng đăng nhập hệ thống để đổi mật khẩu và ký hợp đồng.\n\n" +
                        "Trân trọng.",
                fullName, contractNumber, phone, rawPassword
        );

        notification.setMessageSubject(subject);
        notification.setMessageContent(body);

        notificationRepository.save(notification);
        emailService.sendEmail(notification);
        customerNotificationSmsService.sendForNotification(notification);

        // 8. Gửi SMS qua httpSMS
        String smsContent = String.format(
                "Tai khoan nuoc Phu Tho da duoc tao. SDT: %s, Mat khau: %s. Vui long dang nhap de ky hop dong.",
                phone, rawPassword
        );

        smsService.sendSms(phone, smsContent);
    }

    // --- Helper Methods ---

    private GuestRequestResponseDTO mapToGuestDTO(Contract c) {
        String name = extractNameFromNote(c.getNotes());
        String addr = c.getAddress() != null ? c.getAddress().getAddress() : "Trong ghi chú";
        return GuestRequestResponseDTO.builder()
                .contractId(c.getId())
                .contractNumber(c.getContractNumber())
                .guestPhone(c.getContactPhone())
                .guestName(name)
                .guestAddress(addr)
                .requestDate(c.getApplicationDate())
                .status(c.getContractStatus().name())
                .build();
    }

    private String extractNameFromNote(String note) {
        if (note == null) return "Khách vãng lai";
        // Logic parse đơn giản: Tìm dòng bắt đầu bằng "KHÁCH:"
        // Bạn có thể cải thiện regex này
        if (note.contains("KHÁCH:")) {
            int start = note.indexOf("KHÁCH:") + 6;
            int end = note.indexOf("|", start);
            if (end == -1) end = note.indexOf("\n", start);
            if (end == -1) end = note.length();
            return note.substring(start, end).trim();
        }
        return "Khách vãng lai";
    }

    private String generateRandomPassword(int length) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String removeAccent(String s) {
        // Hàm bỏ dấu tiếng Việt để gửi SMS (cần implement hoặc dùng thư viện Normalizer)
        // Tạm thời trả về nguyên chuỗi
        return s;
    }
}

