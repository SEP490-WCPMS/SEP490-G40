package com.sep490.wcpms.security.services; // Đảm bảo đúng package

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service này được Spring Security sử dụng để tải thông tin chi tiết người dùng
 * (dưới dạng UserDetails) dựa trên username.
 */
@Service // Đánh dấu đây là một Spring Bean Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired // Tiêm AccountRepository để truy vấn database
    AccountRepository accountRepository;

    /**
     * Phương thức cốt lõi được Spring Security gọi khi xác thực.
     * @param username Username người dùng nhập vào form login.
     * @return Một đối tượng UserDetails chứa thông tin user nếu tìm thấy.
     * @throws UsernameNotFoundException Nếu không tìm thấy user với username đó.
     */
    @Override
    @Transactional(readOnly = true) // readOnly = true để tối ưu vì chỉ đọc dữ liệu
    // @Transactional cần thiết để load Role (LAZY fetching)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tìm Account entity trong database bằng username
        Account account = accountRepository.findByUsername(username)
                // Nếu không tìm thấy, ném exception chuẩn của Spring Security
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với username: " + username));

        // 2. Sử dụng phương thức tĩnh build() của UserDetailsImpl
        // để tạo đối tượng UserDetails từ Account entity
        return UserDetailsImpl.build(account);
    }
}