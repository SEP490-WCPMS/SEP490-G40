package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CustomerResponseDTO;
import com.sep490.wcpms.dto.GuestRequestResponseDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.AdminService;
import com.sep490.wcpms.service.SmsService; // Service gửi SMS
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    public List<CustomerResponseDTO> getAllCustomers() {
        List<Account> accounts = accountRepository.findByRole_RoleName(Role.RoleName.CUSTOMER);

        return accounts.stream().map(acc -> {
            Customer cust = customerRepository.findByAccount_Id(acc.getId()).orElse(null);

            // --- SỬA LOGIC LẤY TÊN VÀ MÃ ---
            // Ưu tiên lấy từ bảng Customer, nếu không có thì lấy từ Account
            String code = (cust != null && cust.getCustomerCode() != null) ? cust.getCustomerCode() : acc.getCustomerCode();
            String name = (cust != null && cust.getCustomerName() != null) ? cust.getCustomerName() : acc.getFullName();
            String addr = (cust != null) ? cust.getAddress() : "Chưa cập nhật";

            // Mặc định status là 1 (Active) nếu null
            Integer status = (acc.getStatus() != null) ? acc.getStatus() : 1;

            return CustomerResponseDTO.builder()
                    .accountId(acc.getId())
                    .customerId(cust != null ? cust.getId() : null)
                    .customerCode(code) // <--- Check kỹ dòng này
                    .fullName(name)     // <--- Check kỹ dòng này
                    .email(acc.getEmail())
                    .phone(acc.getPhone())
                    .address(addr)
                    .status(status)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<GuestRequestResponseDTO> getPendingGuestRequests() {
        List<Contract> contracts = contractRepository.findPendingGuestContracts();
        return contracts.stream().map(this::mapToGuestDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approveGuestAndCreateAccount(Integer contractId) {
        // 1. Lấy hợp đồng
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại"));

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
        // Chuyển trạng thái sang chờ ký hợp đồng (hoặc Approved tùy quy trình)
        contract.setContractStatus(Contract.ContractStatus.PENDING_CUSTOMER_SIGN);
        contractRepository.save(contract);

        // 7. Gửi SMS
        String smsContent = String.format(
                "Chao mung %s. Ho so nuoc da duoc duyet. Tai khoan: %s, Mat khau: %s. Vui long dang nhap wcpms.vn de ky hop dong.",
                removeAccent(fullName), phone, rawPassword
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