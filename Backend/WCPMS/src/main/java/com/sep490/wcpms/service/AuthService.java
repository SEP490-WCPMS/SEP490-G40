package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.LoginRequest;
import com.sep490.wcpms.dto.LoginResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role; // Import Role
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.exception.InvalidCredentialsException;
import com.sep490.wcpms.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        // 1. Tìm Account theo username
        Account account = accountRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        // 2. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), account.getPassword())) {
            throw new InvalidCredentialsException("Mật khẩu không đúng.");
        }

        // 3. Kiểm tra trạng thái Account
        if (account.getStatus() == null || account.getStatus() != true) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa.");
        }

        // 4. Lấy RoleName và kiểm tra trạng thái Role (Rất quan trọng)
        Role role = account.getRole();
        if (role == null) {
            throw new InvalidCredentialsException("Tài khoản chưa được gán vai trò.");
        }
        if (role.getStatus() != Role.Status.ACTIVE) {
            throw new InvalidCredentialsException("Vai trò của tài khoản không hoạt động.");
        }

        // 5. Tạo token (Giả lập)
        String dummyToken = "jwt-token-cho-" + account.getUsername();

        // 6. Trả về LoginResponse
        return LoginResponse.builder()
                .id(Long.valueOf(account.getId()))
                .username(account.getUsername())
                .fullName(account.getFullName())
                .roleName(role.getRoleName()) // Lấy RoleName enum từ entity Role
                .department(account.getDepartment())
                .token(dummyToken)
                .build();
    }
}
