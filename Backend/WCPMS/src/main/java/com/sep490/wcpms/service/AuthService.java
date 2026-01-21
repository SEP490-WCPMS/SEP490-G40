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
import com.sep490.wcpms.security.jwt.JwtUtils;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerRepository customerRepository;
    private final EmailService emailService;

    /**
     * Xử lý đăng nhập.
     * Thêm @Transactional để đảm bảo query Customer hoạt động tốt.
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // --- 1. XÁC THỰC BẰNG SPRING SECURITY ---
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new InvalidCredentialsException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // --- 2. TẠO JWT TOKEN ---
        String jwt = jwtUtils.generateJwtToken(authentication);

        // --- 3. LẤY THÔNG TIN USER TỪ AUTHENTICATION ---
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // --- 4. LẤY LẠI ACCOUNT TỪ DB ---
        Account account = accountRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        // Kiểm tra status
        if (account.getStatus() == 0) {
            throw new InvalidCredentialsException("Tài khoản chưa được kích hoạt.");
        }

        Role role = account.getRole();
        if (role == null || role.getStatus() != Role.Status.ACTIVE) {
            throw new InvalidCredentialsException("Vai trò không hợp lệ.");
        }

        // --- 5. CẬP NHẬT LAST LOGIN ---
        account.setLastLogin(LocalDateTime.now());
        accountRepository.save(account);

        // --- 6. LẤY CCCD (DEBUG LOGIC) ---
        String identityNumber = null;

        // Log để kiểm tra xem ID là bao nhiêu
        System.out.println("DEBUG LOGIN: Checking customer info for Account ID: " + account.getId());

        // Tìm Customer theo Account ID (Không cần check Role if để tránh lỗi logic)
        // Lưu ý: Đảm bảo CustomerRepository có hàm findByAccount_Id(Integer id)
        Optional<Customer> customerOpt = customerRepository.findByAccount_Id(account.getId());

        if (customerOpt.isPresent()) {
            Customer cust = customerOpt.get();
            identityNumber = cust.getIdentityNumber();
            System.out.println("DEBUG LOGIN: Found Customer ID: " + cust.getId() + " - Identity: " + identityNumber);
        } else {
            System.out.println("DEBUG LOGIN: No Customer found for this Account ID.");
        }
        // ------------------------------------------------

        // --- 7. TẠO RESPONSE ---
        return LoginResponse.builder()
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .fullName(account.getFullName())
                .roleName(role.getRoleName())
                .department(account.getDepartment())
                .token(jwt)
                .phone(account.getPhone())
                .email(account.getEmail())
                .customerCode(account.getCustomerCode())

                // Đảm bảo DTO LoginResponse đã có trường này
                .identityNumber(identityNumber)
                .build();
    }

    // --- CÁC HÀM KHÁC GIỮ NGUYÊN ---

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (accountRepository.existsByUsername(request.getUsername())) {
            return RegisterResponse.builder().message("Tên đăng nhập đã tồn tại.").build();
        }
        if (request.getEmail() != null && accountRepository.existsByEmail(request.getEmail())) {
            return RegisterResponse.builder().message("Email đã tồn tại.").build();
        }

        Role customerRole = roleRepository.findByRoleName(Role.RoleName.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER không tồn tại."));

        String newCustomerCode = generateNewCustomerCode();

        Account newAccount = new Account();
        newAccount.setUsername(request.getUsername());
        newAccount.setPassword(passwordEncoder.encode(request.getPassword()));
        newAccount.setEmail(request.getEmail());
        newAccount.setPhone(request.getPhone());
        newAccount.setFullName(request.getFullName());
        newAccount.setRole(customerRole);
        newAccount.setCustomerCode(newCustomerCode);
        newAccount.setStatus(0); // Chưa active

        String token = UUID.randomUUID().toString();
        newAccount.setVerificationToken(token);
        newAccount.setTokenExpiryDate(LocalDateTime.now().plusHours(24));

        Account savedAccount = accountRepository.save(newAccount);

        Customer newCustomer = new Customer();
        newCustomer.setAccount(savedAccount);
        newCustomer.setCustomerCode(newCustomerCode);
        newCustomer.setCustomerName(savedAccount.getFullName());
        newCustomer.setAddress(request.getAddress());

        customerRepository.save(newCustomer);

        emailService.sendVerificationEmail(savedAccount.getEmail(), savedAccount.getFullName(), token);

        return RegisterResponse.builder()
                .id(savedAccount.getId())
                .username(savedAccount.getUsername())
                .fullName(savedAccount.getFullName())
                .customerCode(savedAccount.getCustomerCode())
                .roleName(savedAccount.getRole().getRoleName().name())
                .message("Đăng ký thành công. Vui lòng kiểm tra email.")
                .build();
    }

    private String generateNewCustomerCode() {
        Optional<String> maxCodeOptional = customerRepository.findMaxCustomerCode();
        int nextId = 1;
        if (maxCodeOptional.isPresent()) {
            String maxCode = maxCodeOptional.get();
            try {
                if (maxCode.matches("KH\\d+")) {
                    String numPart = maxCode.substring(2);
                    if (!numPart.isEmpty()) {
                        nextId = Integer.parseInt(numPart) + 1;
                    }
                }
            } catch (Exception e) {}
        }
        return String.format("KH%03d", nextId);
    }

    public void forgotPassword(String email) {
        Optional<Account> accountOptional = accountRepository.findByEmail(email);
        if (accountOptional.isEmpty()) {
            throw new ResourceNotFoundException("Email không tồn tại.");
        }
        Account account = accountOptional.get();
        String token = UUID.randomUUID().toString();
        account.setPasswordResetToken(token);
        account.setResetTokenExpiry(LocalDateTime.now().plus(15, ChronoUnit.MINUTES));
        accountRepository.save(account);

        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        emailService.sendEmail(account.getEmail(), "Đặt lại mật khẩu", "Link: " + resetLink);
    }

    public void resetPassword(String token, String newPassword) {
        Account account = accountRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new InvalidCredentialsException("Token lỗi."));
        if (account.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("Token hết hạn.");
        }
        account.setPassword(passwordEncoder.encode(newPassword));
        account.setPasswordResetToken(null);
        account.setResetTokenExpiry(null);
        accountRepository.save(account);
    }

    public void verifyAccount(String token) {
        Account account = accountRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token lỗi."));
        if (account.getTokenExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token hết hạn.");
        }
        account.setStatus(1);
        account.setVerificationToken(null);
        account.setTokenExpiryDate(null);
        accountRepository.save(account);
    }
}