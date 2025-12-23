package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ChangePasswordRequestDTO;
import com.sep490.wcpms.dto.ProfileResponseDTO;
import com.sep490.wcpms.dto.ProfileUpdateRequestDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ActivityLogService activityLogService;

    // --- THÊM LOGIC ĐỔI MẬT KHẨU ---
    @Override
    @Transactional
    public void changePassword(Integer accountId, ChangePasswordRequestDTO dto) {
        // 1. Kiểm tra mật khẩu mới có khớp không
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        }

        // 2. Lấy tài khoản
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));

        // 3. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(dto.getOldPassword(), account.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác.");
        }

        // 4. Mã hóa và cập nhật mật khẩu mới
        account.setPassword(passwordEncoder.encode(dto.getNewPassword()));

        // 5. Lưu lại
        accountRepository.save(account);

        // --- GHI LOG ĐỔI MẬT KHẨU ---
        try {
            ActivityLog log = new ActivityLog();
            log.setSubjectType("ACCOUNT_SECURITY");
            log.setSubjectId(account.getUsername());
            log.setAction("PASSWORD_CHANGED");
            log.setActorType("USER"); // Chính chủ tự đổi
            activityLogService.save(log);
        } catch (Exception e) {}
    }

    @Override
    public ProfileResponseDTO getProfileById(Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));
        Customer customer = customerRepository.findByAccount_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng cho tài khoản ID: " + id));

        return mapToProfileResponseDTO(account, customer);
    }

    // --- SỬA TÊN HÀM VÀ THAM SỐ ---
    @Override
    @Transactional
    public ProfileResponseDTO updateProfile(Integer id, ProfileUpdateRequestDTO dto) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));
        Customer customer = customerRepository.findByAccount_Id(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng cho tài khoản ID: " + id));

        // 2. Cập nhật các trường cho bảng Account
        account.setFullName(dto.getFullName());
        account.setEmail(dto.getEmail());
        account.setPhone(dto.getPhone());

        // 3. Cập nhật các trường cho bảng Customer
        customer.setAddress(dto.getAddress());
        customer.setStreet(dto.getStreet());
        customer.setDistrict(dto.getDistrict());
        customer.setProvince(dto.getProvince());

        // 4. Lưu lại (JPA sẽ tự động cập nhật vì các entity đang được quản lý trong transaction)
        Account updatedAccount = accountRepository.save(account);
        Customer updatedCustomer = customerRepository.save(customer);

        // 5. Trả về DTO với thông tin đã được cập nhật
        return mapToProfileResponseDTO(updatedAccount, updatedCustomer);
    }

    // Hàm tiện ích để chuyển đổi từ Entity sang DTO
    private ProfileResponseDTO mapToProfileResponseDTO(Account account, Customer customer) {
        return new ProfileResponseDTO(
                account.getId(),
                account.getFullName(),
                account.getEmail(),
                account.getPhone(),
                customer.getAddress(),
                customer.getStreet(),
                customer.getDistrict(),
                customer.getProvince()
        );
    }
}