package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.LoginRequest;
import com.sep490.wcpms.dto.LoginResponse;
import com.sep490.wcpms.dto.RegisterRequest;
import com.sep490.wcpms.dto.RegisterResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.exception.InvalidCredentialsException; // Giữ lại nếu cần cho logic khác
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.RoleRepository;
import com.sep490.wcpms.security.jwt.JwtUtils; // <-- Import JwtUtils
// --- THAY THẾ BẰNG IMPORT UserDetailsImpl ĐÚNG CỦA BẠN ---
import com.sep490.wcpms.security.services.UserDetailsImpl; // <-- Import UserDetailsImpl
// ---
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager; // <-- Import AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; // <-- Import Token
import org.springframework.security.core.Authentication; // <-- Import Authentication
import org.springframework.security.core.context.SecurityContextHolder; // <-- Import SecurityContextHolder
import org.springframework.security.core.userdetails.UsernameNotFoundException; // Spring Security ném lỗi này
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor // Tự động inject các biến final
public class AuthService {

    // --- Inject các bean cần thiết ---
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerRepository customerRepository;
    // ---

    /**
     * Xử lý đăng nhập bằng Spring Security AuthenticationManager và tạo JWT token.
     * @param request Chứa username và password.
     * @return LoginResponse chứa thông tin user và token.
     * @throws ResourceNotFoundException (Hoặc AuthenticationException) nếu sai username/password.
     * @throws InvalidCredentialsException nếu tài khoản/role bị vô hiệu hóa.
     */
    public LoginResponse login(LoginRequest request) {
        // --- BƯỚC 1: XÁC THỰC BẰNG SPRING SECURITY ---
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    // Tạo đối tượng chứa username/password người dùng nhập
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            // Spring Security sẽ ném lỗi nếu username không tồn tại hoặc password sai
            // Bạn có thể bắt lỗi cụ thể hơn (BadCredentialsException, DisabledException...)
            System.err.println("Authentication failed: " + e.getMessage());
            throw new InvalidCredentialsException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }

        // Nếu xác thực thành công, đặt Authentication vào SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // --- BƯỚC 2: TẠO JWT TOKEN ---
        String jwt = jwtUtils.generateJwtToken(authentication);

        // --- BƯỚC 3: LẤY THÔNG TIN USER TỪ AUTHENTICATION ---
        // Principal lúc này chính là UserDetailsImpl mà UserDetailsService đã load
        // === SỬA LẠI TÊN UserDetailsImpl NẾU CẦN ===
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // --- BƯỚC 4: LẤY THÊM THÔNG TIN TỪ ACCOUNT (Nếu cần và UserDetails chưa có) ---
        // Optional: Lấy lại Account entity để lấy fullName, department nếu UserDetailsImpl không lưu
        Account account = accountRepository.findById(userDetails.getId()).orElse(null); // Tìm lại account
        if (account == null) {
            // Trường hợp hiếm gặp, user tồn tại trong security context nhưng không có trong DB?
            throw new ResourceNotFoundException("Tài khoản không tìm thấy sau khi xác thực.");
        }
        // Kiểm tra lại trạng thái account và role (an toàn hơn)
        if (!userDetails.isEnabled() || account.getStatus() == null || account.getStatus() != 1) {
            throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa.");
        }
        Role role = account.getRole();
        if (role == null || role.getStatus() != Role.Status.ACTIVE) {
            throw new InvalidCredentialsException("Vai trò của tài khoản không hoạt động hoặc không tồn tại.");
        }


        // --- BƯỚC 5: CẬP NHẬT LAST LOGIN (Tùy chọn) ---
        account.setLastLogin(LocalDateTime.now());
        accountRepository.save(account); // Lưu lại

        // --- BƯỚC 6: TẠO VÀ TRẢ VỀ LOGIN RESPONSE ---
        return LoginResponse.builder()
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .fullName(account.getFullName()) // Lấy từ Account entity
                .roleName(role.getRoleName()) // Lấy Enum RoleName từ Account entity
                .department(account.getDepartment()) // Lấy Enum Department từ Account entity
                .token(jwt) // Trả về token thật
                .build();
    }

    // --- Hàm register và generateNewCustomerCode giữ nguyên logic cũ của bạn ---
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // --- SỬA LẠI KIỂM TRA TỒN TẠI ---
        if (accountRepository.existsByUsername(request.getUsername())) {
            // Cách 1: Ném lỗi chuẩn hơn (yêu cầu @ControllerAdvice xử lý)
            // throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại!");

            // Cách 2: Trả về thông báo lỗi trong Response (Đơn giản hơn)
            return RegisterResponse.builder()
                    .message("Đăng ký thất bại: Tên đăng nhập '" + request.getUsername() + "' đã tồn tại.")
                    .build(); // Trả về ngay lập tức
        }
        if (request.getEmail() != null && accountRepository.existsByEmail(request.getEmail())) {
            // Cách 1: throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại!");
            // Cách 2:
            return RegisterResponse.builder()
                    .message("Đăng ký thất bại: Email '" + request.getEmail() + "' đã tồn tại.")
                    .build();
        }
        // --- HẾT PHẦN SỬA ---

        Role customerRole = roleRepository.findByRoleName(Role.RoleName.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER không tồn tại trong hệ thống."));

        String newCustomerCode = generateNewCustomerCode();

        Account newAccount = new Account();
        newAccount.setUsername(request.getUsername());
        newAccount.setPassword(passwordEncoder.encode(request.getPassword()));
        newAccount.setEmail(request.getEmail());
        newAccount.setPhone(request.getPhone());
        newAccount.setFullName(request.getFullName());
        newAccount.setRole(customerRole);
        newAccount.setDepartment(null);
        newAccount.setCustomerCode(newCustomerCode);
        newAccount.setStatus(1); // 1 = Kích hoạt // Kích hoạt tài khoản
        // createdAt tự động bởi @CreationTimestamp

        Account savedAccount = accountRepository.save(newAccount);

        Customer newCustomer = new Customer();
        newCustomer.setAccount(savedAccount);
        newCustomer.setCustomerCode(newCustomerCode);
        newCustomer.setCustomerName(savedAccount.getFullName());
        newCustomer.setAddress(request.getAddress());
        // createdAt/updatedAt tự động
        customerRepository.save(newCustomer);

        return RegisterResponse.builder()
                .id(savedAccount.getId())
                .username(savedAccount.getUsername())
                .fullName(savedAccount.getFullName())
                .customerCode(savedAccount.getCustomerCode())
                .roleName(savedAccount.getRole().getRoleName().name()) // Trả về tên String của Enum
                .message("Đăng ký tài khoản và hồ sơ khách hàng thành công.")
                .build();
    }

    private String generateNewCustomerCode() {
        Optional<String> maxCodeOptional = customerRepository.findMaxCustomerCode(); // Đảm bảo repo có hàm này
        int nextId = 1;
        if (maxCodeOptional.isPresent()) {
            String maxCode = maxCodeOptional.get();
            try {
                // Giả sử mã có dạng "KH" + số (KH001, KH123)
                if (maxCode.matches("KH\\d+")) {
                    String numPart = maxCode.substring(2);
                    if (!numPart.isEmpty()) {
                        nextId = Integer.parseInt(numPart) + 1;
                    }
                }
            } catch (NumberFormatException | IndexOutOfBoundsException e) {
                System.err.println("Lỗi parse customerCode: '" + maxCode + "'. Sử dụng ID mặc định.");
                // Có thể log lỗi chi tiết hơn
            }
        }
        // Format với 3 chữ số (ví dụ: KH001, KH010, KH124)
        return String.format("KH%03d", nextId);
    }
}