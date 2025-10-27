package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.LoginRequest;
import com.sep490.wcpms.dto.LoginResponse;
import com.sep490.wcpms.dto.RegisterRequest;
import com.sep490.wcpms.dto.RegisterResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.exception.InvalidCredentialsException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerRepository customerRepository; // <-- Đã tiêm CustomerRepository

    public LoginResponse login(LoginRequest request) {
        // ... (Code login của bạn, không thay đổi)
        // 1. Tìm Account theo username
        Account account = accountRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại.")); // <-- Lỗi của bạn đang ở đây

        // 2. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), account.getPassword())) {
            throw new InvalidCredentialsException("Mật khẩu không đúng.");
        }

        // 3. Kiểm tra trạng thái Account
        if (account.getStatus() == null || !account.getStatus()) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa.");
        }

        // 4. Lấy Role và kiểm tra trạng thái Role
        Role role = account.getRole();
        if (role == null) {
            throw new InvalidCredentialsException("Tài khoản chưa được gán vai trò.");
        }
        if (role.getStatus() != Role.Status.ACTIVE) {
            throw new InvalidCredentialsException("Vai trò của tài khoản không hoạt động.");
        }

        // 5. Tạo token (Giả lập)
        String dummyToken = "jwt-token-cho-" + account.getUsername();

        // 6. Cập nhật lastLogin (tùy chọn) và trả về LoginResponse
        account.setLastLogin(LocalDateTime.now());
        // accountRepository.save(account);

        return LoginResponse.builder()
                .id(account.getId())
                .username(account.getUsername())
                .fullName(account.getFullName())
                .roleName(role.getRoleName())
                .department(account.getDepartment())
                .token(dummyToken)
                .build();
    }

    @Transactional // Đảm bảo cả 2 thao tác (tạo Account và Customer) cùng thành công
    public RegisterResponse register(RegisterRequest request) {

        // ... (Code kiểm tra, tìm Role...)
        Role customerRole = roleRepository.findByRoleName(Role.RoleName.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER không tồn tại trong hệ thống."));


        // 3. Tạo Customer Code (SỬ DỤNG HÀM ĐÃ SỬA BÊN DƯỚI)
        String newCustomerCode = generateNewCustomerCode();

        // 4. Tạo đối tượng Account
        Account newAccount = new Account();
        newAccount.setUsername(request.getUsername());
        newAccount.setPassword(passwordEncoder.encode(request.getPassword()));
        newAccount.setEmail(request.getEmail());
        newAccount.setPhone(request.getPhone());
        newAccount.setFullName(request.getFullName());
        newAccount.setRole(customerRole);
        newAccount.setDepartment(null);
        newAccount.setCustomerCode(newCustomerCode); // Gán mã mới cho Account
        newAccount.setStatus(Boolean.TRUE);
        newAccount.setCreatedAt(LocalDateTime.now());

        // 5. Lưu Account vào Database (Bước 1/2)
        Account savedAccount = accountRepository.save(newAccount);

        // 6. Tạo đối tượng Customer
        Customer newCustomer = new Customer();

        // 7. Thiết lập thông tin cho Customer
        newCustomer.setAccount(savedAccount);
        newCustomer.setCustomerCode(newCustomerCode); // Gán mã mới cho Customer
        newCustomer.setCustomerName(savedAccount.getFullName());
        newCustomer.setAddress(request.getAddress());
        newCustomer.setCreatedAt(LocalDateTime.now());
        newCustomer.setUpdatedAt(LocalDateTime.now());

        // 8. Lưu Customer vào Database (Bước 2/2)
        // Nếu bước này lỗi, @Transactional sẽ hủy bỏ cả bước 5
        customerRepository.save(newCustomer);

        // 9. Trả về RegisterResponse DTO
        return RegisterResponse.builder()
                .id(savedAccount.getId())
                .username(savedAccount.getUsername())
                .fullName(savedAccount.getFullName())
                .customerCode(savedAccount.getCustomerCode())
                .roleName(savedAccount.getRole().getRoleName().name())
                .message("Đăng ký tài khoản và hồ sơ khách hàng thành công.")
                .build();
    }

    // HÀM QUAN TRỌNG ĐÃ SỬA
    private String generateNewCustomerCode() {
        // *** SỬA LỚN ***
        // Tìm mã khách hàng lớn nhất từ CUSTOMER REPOSITORY (bảng customers)
        Optional<String> maxCodeOptional = customerRepository.findMaxCustomerCode();

        int nextId = 1;
        if (maxCodeOptional.isPresent()) {
            String maxCode = maxCodeOptional.get(); // Ví dụ: KH123
            try {
                String numPart = maxCode.substring(2); // Lấy "123"
                nextId = Integer.parseInt(numPart) + 1; // "123" -> 123 + 1 = 124
            } catch (Exception e) {
                System.err.println("Lỗi parse customerCode: " + maxCode);
            }
        }
        // Format lại: 124 -> "KH124" (nếu dùng %03d)
        return String.format("KH%03d", nextId);
    }
}

