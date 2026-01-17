package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractDetailsDTO;
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
    private final MeterInstallationRepository meterInstallationRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final CustomerNotificationSmsService customerNotificationSmsService;
    private final InternalNotificationService internalNotificationService;

    @Override
    public List<CustomerResponseDTO> getAllCustomers() {
        // 1. Lấy danh sách customer (kèm account để tối ưu query)
        List<Customer> customers = customerRepository.findAllWithAccount();

        return customers.stream().map(cust -> {
            // Bước 1: Tạo DTO cơ bản từ thông tin Customer/Account
            CustomerResponseDTO dto = CustomerResponseDTO.fromEntity(cust);

            // Bước 2: Logic tìm Mã Đồng Hồ (Meter Code)
            String meterCode = "---";
            String meterStatus = "";

            try {
                // Tìm danh sách hợp đồng của khách này
                List<Contract> contracts = contractRepository.findByCustomer_IdOrderByIdDesc(cust.getId());

                // Lấy hợp đồng nào đang ACTIVE (hoặc PENDING_SIGN nếu vừa lắp xong)
                // Ưu tiên hợp đồng mới nhất
                Contract activeContract = contracts.stream()
                        .filter(c -> c.getContractStatus() == Contract.ContractStatus.ACTIVE)
                        .findFirst()
                        .orElse(null);

                if (activeContract != null) {
                    // Tìm bản ghi lắp đặt đồng hồ mới nhất của hợp đồng này
                    // (Sử dụng repository của MeterInstallation)
                    var installation = meterInstallationRepository.findTopByContractOrderByCreatedAtDesc(activeContract);

                    if (installation.isPresent() && installation.get().getWaterMeter() != null) {
                        WaterMeter wm = installation.get().getWaterMeter();
                        meterCode = wm.getMeterCode();
                        meterStatus = wm.getMeterStatus() != null ? wm.getMeterStatus().name() : "";
                    }
                }
            } catch (Exception e) {
                // Log lỗi nhẹ nếu cần, không để crash luồng chính
                System.err.println("Lỗi lấy đồng hồ cho KH ID " + cust.getId() + ": " + e.getMessage());
            }

            // Bước 3: Gán thông tin đồng hồ vào DTO
            dto.setMeterCode(meterCode);
            dto.setMeterStatus(meterStatus);

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ContractDetailsDTO> getContractsByCustomerId(Integer customerId) {
        // Tìm tất cả hợp đồng của khách hàng này (sắp xếp mới nhất trước)
        List<Contract> contracts = contractRepository.findByCustomer_IdOrderByIdDesc(customerId);

        // Convert sang ContractDetailsDTO
        return contracts.stream()
                .map(ContractDetailsDTO::new) // Sử dụng constructor có sẵn trong DTO
                .collect(Collectors.toList());
    }

    @Override
    public List<GuestRequestResponseDTO> getPendingGuestRequests() {
        // Lấy các hợp đồng chưa có Customer và trạng thái là PENDING_SURVEY_REVIEW hoặc APPROVED
        List<Contract.ContractStatus> targetStatuses = Arrays.asList(
                Contract.ContractStatus.PENDING_SURVEY_REVIEW,
                Contract.ContractStatus.APPROVED
        );

        List<Contract> contracts = contractRepository.findByCustomerIsNullAndContractStatusIn(targetStatuses);

        return contracts.stream().map(this::mapToGuestDTO).collect(Collectors.toList());
    }

    @Override
    public long countPendingGuestRequests() {
        // Lấy các hợp đồng chưa có Customer và trạng thái là PENDING_SURVEY_REVIEW hoặc APPROVED
        List<Contract.ContractStatus> targetStatuses = Arrays.asList(
                Contract.ContractStatus.PENDING_SURVEY_REVIEW,
                Contract.ContractStatus.APPROVED
        );

        // Gọi repository để đếm
        return contractRepository.countByCustomerIsNullAndContractStatusIn(targetStatuses);
    }

    @Override
    @Transactional
    public void approveGuestAndCreateAccount(Integer contractId) {
        // 1. Lấy hợp đồng
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại"));

        // Kiểm tra trạng thái hợp lệ
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

        String fullName = extractNameFromNote(contract.getNotes());
        String addressStr = contract.getAddress() != null ? contract.getAddress().getAddress() : "Chưa cập nhật";

        // 3. Tạo Account
        if (accountRepository.existsByUsername(phone)) {
            throw new IllegalArgumentException("SĐT này đã được đăng ký tài khoản khác.");
        }

        String rawPassword = generateRandomPassword(6);
        Role customerRole = roleRepository.findByRoleName(Role.RoleName.CUSTOMER)
                .orElseThrow(() -> new RuntimeException("Role Customer not found"));

        Account account = new Account();
        account.setUsername(phone);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setFullName(fullName);
        account.setPhone(phone);
        account.setRole(customerRole);
        account.setStatus(1);
        account.setCustomerCode("KH" + System.currentTimeMillis());

        Account savedAccount = accountRepository.save(account);

        // 4. Tạo Customer
        Customer customer = new Customer();
        customer.setAccount(savedAccount);
        customer.setCustomerName(fullName);
        customer.setCustomerCode(savedAccount.getCustomerCode());
        customer.setAddress(addressStr);
        customer.setContactPersonPhone(phone);

        Customer savedCustomer = customerRepository.save(customer);

        // 5. Cập nhật Address
        if (contract.getAddress() != null) {
            Address addr = contract.getAddress();
            addr.setCustomer(savedCustomer);
            addressRepository.save(addr);
        }

        // 6. Cập nhật Contract
        contract.setCustomer(savedCustomer);
        contractRepository.save(contract);

        // 7. Thông báo
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

        // === THÔNG BÁO CHO SERVICE STAFF ĐÃ TẠO TÀI KHOẢN ===
        if (contract.getServiceStaff() != null) {
            internalNotificationService.createNotification(
                    contract.getServiceStaff().getId(),
                    null,
                    "Đã tạo tài khoản cho khách",
                    "Khách hàng " + fullName + " (HĐ: " + contractNumber + ") đã có tài khoản. Bạn có thể gửi hợp đồng đi ký.",
                    contract.getId(),
                    InternalNotification.NotificationType.GUEST_ACCOUNT_CREATED
            );
        }
        // ====================================================

        // 8. Gửi SMS
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
        return s;
    }
}