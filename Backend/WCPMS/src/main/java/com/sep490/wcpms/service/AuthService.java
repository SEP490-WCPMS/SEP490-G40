package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.LoginRequest;
import com.sep490.wcpms.dto.LoginResponse;
import com.sep490.wcpms.dto.RegisterRequest;
import com.sep490.wcpms.dto.RegisterResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.exception.InvalidCredentialsException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        // 1. Tìm Account theo username
        Account account = accountRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        // 2. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), account.getPassword())) {
            throw new InvalidCredentialsException("Mật khẩu không đúng.");
        }

        // 3. Kiểm tra trạng thái Account (THAY ĐỔI QUAN TRỌNG: Kiểm tra status là Boolean)
        // Nếu status là null hoặc là Boolean FALSE, tài khoản bị vô hiệu hóa
        if (account.getStatus() == null || !account.getStatus()) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa.");
        }

        // 4. Lấy Role và kiểm tra trạng thái Role (Sử dụng entity Role đã cập nhật)
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
        // accountRepository.save(account); // Cần save lại nếu muốn cập nhật DB ngay lập tức

        return LoginResponse.builder()
                .id(account.getId()) // Đã là Integer
                .username(account.getUsername())
                .fullName(account.getFullName())
                .roleName(role.getRoleName())
                .department(account.getDepartment()) // Department enum mới (chữ hoa)
                .token(dummyToken)
                .build();
    }

    public RegisterResponse register(RegisterRequest request) {

        // 1. Kiểm tra username/email/phone đã tồn tại (Tùy chọn, nên thêm vào Production)
        // if (accountRepository.findByUsername(request.getUsername()).isPresent()) { ... throw new BadRequestException }

        // 2. Tìm Role CUSTOMER
        Role customerRole = roleRepository.findByRoleName(Role.RoleName.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER không tồn tại trong hệ thống."));

        // 3. Tạo Customer Code tăng dần (KH###)
        String newCustomerCode = generateNewCustomerCode();

        // 4. Tạo đối tượng Account
        Account newAccount = new Account();
        newAccount.setUsername(request.getUsername());
        newAccount.setPassword(passwordEncoder.encode(request.getPassword())); // Mã hóa mật khẩu
        newAccount.setEmail(request.getEmail());
        newAccount.setPhone(request.getPhone());
        newAccount.setFullName(request.getFullName());

        // Gán các giá trị mặc định/tự động
        newAccount.setRole(customerRole);
        newAccount.setDepartment(null); // CUSTOMER không thuộc Department nào
        newAccount.setCustomerCode(newCustomerCode);
        newAccount.setStatus(Boolean.TRUE); // Kích hoạt tài khoản
        newAccount.setCreatedAt(LocalDateTime.now());
        // UpdatedAt và LastLogin sẽ được Spring/Hibernate xử lý

        // 5. Lưu vào Database
        Account savedAccount = accountRepository.save(newAccount);

        // 6. Trả về RegisterResponse DTO
        return RegisterResponse.builder()
                .id(savedAccount.getId())
                .username(savedAccount.getUsername())
                .fullName(savedAccount.getFullName())
                .customerCode(savedAccount.getCustomerCode())
                .roleName(savedAccount.getRole().getRoleName().name()) // Lấy tên enum dạng String
                .message("Đăng ký tài khoản thành công.")
                .build();
    }
    private String generateNewCustomerCode() {
        // Tìm mã khách hàng lớn nhất hiện có
        Optional<String> maxCodeOptional = accountRepository.findMaxCustomerCode();

        int nextId = 1;
        if (maxCodeOptional.isPresent()) {
            String maxCode = maxCodeOptional.get(); // Ví dụ: KH123
            try {
                // Trích xuất phần số (123) và tăng lên 1
                // Cần đảm bảo maxCode có định dạng 'KH' theo sau là số
                String numPart = maxCode.substring(2);
                nextId = Integer.parseInt(numPart) + 1;
            } catch (Exception e) {
                // Xử lý lỗi nếu format không đúng, có thể log hoặc giữ nguyên nextId = 1
                System.err.println("Lỗi parse customerCode: " + maxCode);
            }
        }

        // Format lại thành KH### (ví dụ: 1 -> KH001, 12 -> KH012, 123 -> KH123)
        return String.format("KH%03d", nextId);
    }
}