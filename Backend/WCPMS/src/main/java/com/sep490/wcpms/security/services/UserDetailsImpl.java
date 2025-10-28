package com.sep490.wcpms.security.services; // Đảm bảo đúng package

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role; // Cần import Role
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Objects;

/**
 * Lớp đại diện cho người dùng đã được xác thực trong Spring Security.
 * Chứa thông tin cần thiết lấy từ Account entity.
 */
public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L; // Bắt buộc cho Serializable

    private final Integer id; // ID của Account
    private final String username; // Username
    private final String email; // Email (tùy chọn)

    @JsonIgnore // Không bao giờ trả về password qua API
    private final String password; // Password đã mã hóa

    private final Boolean status; // Trạng thái kích hoạt của Account

    // Lưu quyền hạn (role) của người dùng
    private final GrantedAuthority authority;

    // Constructor (private để khuyến khích dùng hàm build)
    private UserDetailsImpl(Integer id, String username, String email, String password, Boolean status, GrantedAuthority authority) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.status = status;
        this.authority = authority;
    }

    /**
     * Phương thức tĩnh (static factory method) để tạo đối tượng UserDetailsImpl
     * từ một đối tượng Account entity.
     * @param account Đối tượng Account lấy từ database.
     * @return Một đối tượng UserDetailsImpl.
     */
    public static UserDetailsImpl build(Account account) {
        // Kiểm tra null an toàn cho Role
        Role role = account.getRole();
        if (role == null || role.getRoleName() == null) {
            // Xử lý trường hợp không có role (ví dụ: ném lỗi hoặc gán role mặc định)
            // Tạm thời ném lỗi để dễ debug
            throw new IllegalStateException("Account ID " + account.getId() + " does not have a valid Role assigned.");
        }

        // Chuyển đổi Role entity thành GrantedAuthority mà Spring Security hiểu
        // Lấy tên enum (ví dụ: TECHNICAL_STAFF) làm tên quyền
        GrantedAuthority authority = new SimpleGrantedAuthority(role.getRoleName().name());

        // Gọi constructor để tạo đối tượng
        return new UserDetailsImpl(
                account.getId(),
                account.getUsername(),
                account.getEmail(),
                account.getPassword(),
                account.getStatus(), // Lấy trạng thái từ Account
                authority);
    }

    // --- Các phương thức bắt buộc từ interface UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Trả về danh sách các quyền hạn (chỉ có 1 quyền trong trường hợp này)
        return Collections.singletonList(authority);
    }

    // --- Các phương thức getter cần thiết ---

    /**
     * Lấy ID của Account (Dùng trong các Controller).
     * @return ID kiểu Integer.
     */
    public Integer getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String getPassword() {
        // Trả về password đã mã hóa
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    // --- Các phương thức kiểm tra trạng thái tài khoản ---
    // (Bạn có thể thêm logic phức tạp hơn nếu cần)

    @Override
    public boolean isAccountNonExpired() {
        // Giả định tài khoản không bao giờ hết hạn
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Giả định tài khoản không bao giờ bị khóa (trừ khi status = false)
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        // Giả định mật khẩu không bao giờ hết hạn
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Tài khoản được kích hoạt nếu trường 'status' trong DB là true
        return status != null && status;
    }

    // --- (Tùy chọn) Các phương thức equals và hashCode ---
    // Giúp so sánh các đối tượng UserDetailsImpl dựa trên ID
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}