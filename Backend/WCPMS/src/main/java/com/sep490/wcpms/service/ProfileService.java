package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.UpdateProfileDTO;
import com.sep490.wcpms.dto.UserProfileDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // Sử dụng constructor injection, tốt hơn @Autowired
public class ProfileService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfileByUsername(String username) {
        // 1. Tìm tài khoản bằng username
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        UserProfileDTO profileDTO = new UserProfileDTO();

        // 2. Map dữ liệu từ Account Entity sang DTO
        profileDTO.setId(account.getId());
        profileDTO.setUsername(account.getUsername());
        profileDTO.setFullName(account.getFullName());
        profileDTO.setEmail(account.getEmail());
        profileDTO.setPhone(account.getPhone());

        // Lấy tên vai trò từ đối tượng Role liên kết
        if (account.getRole() != null) {
            profileDTO.setRole(String.valueOf(account.getRole().getRoleName())); // Giả sử Entity Role có field roleName
        }

        // Lấy tên phòng ban từ enum
        if (account.getDepartment() != null) {
            profileDTO.setDepartment(account.getDepartment().name());
        }

        // 3. Nếu là khách hàng (customer), lấy thêm thông tin chi tiết
        if ("customer".equalsIgnoreCase(profileDTO.getRole())) {
            customerRepository.findByAccountId(account.getId()).ifPresent(customer -> {
                profileDTO.setCustomerCode(customer.getCustomerCode());
                profileDTO.setIdentityNumber(customer.getIdentityNumber());

                // Ghép các thành phần địa chỉ lại thành một chuỗi đầy đủ
                StringBuilder addressBuilder = new StringBuilder();
                if (customer.getAddress() != null) addressBuilder.append(customer.getAddress());
                if (customer.getStreet() != null) addressBuilder.append(", ").append(customer.getStreet());
                // Bạn có thể lấy tên Phường từ customer.getWard().getWardName() nếu cần
                if (customer.getDistrict() != null) addressBuilder.append(", ").append(customer.getDistrict());
                if (customer.getProvince() != null) addressBuilder.append(", ").append(customer.getProvince());

                profileDTO.setAddress(addressBuilder.toString());
            });
        }

        return profileDTO;
    }

    // --- ⭐ PHƯƠNG THỨC MỚI ĐỂ CẬP NHẬT ⭐ ---
    @Transactional
    public UserProfileDTO updateUserProfile(String username, UpdateProfileDTO updateData) {
        // 1. Tìm tài khoản hiện tại
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // 2. Cập nhật các trường trong Entity Account
        // Kiểm tra để không ghi đè giá trị null hoặc rỗng vào dữ liệu hiện có

        if (updateData.getEmail() != null && !updateData.getEmail().isEmpty()) {
            account.setEmail(updateData.getEmail());
        }
        if (updateData.getPhone() != null) {
            account.setPhone(updateData.getPhone());
        }

        // 3. Lưu lại thay đổi vào database
        Account updatedAccount = accountRepository.save(account);

        // (Tùy chọn) Nếu cần cập nhật cả thông tin Customer, bạn có thể thêm logic ở đây
         customerRepository.findByAccountId(updatedAccount.getId()).ifPresent(customer -> {
             if (updateData.getAddress() != null) {
                 customer.setAddress(updateData.getAddress());
             }
             customerRepository.save(customer);
         });


        // 4. Trả về thông tin hồ sơ đã được cập nhật
        return getUserProfileByUsername(username);
    }
}