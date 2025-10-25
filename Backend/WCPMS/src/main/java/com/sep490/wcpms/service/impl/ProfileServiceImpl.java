package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ProfileResponseDTO;
import com.sep490.wcpms.dto.ProfileUpdateRequestDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public ProfileResponseDTO getProfileByAccountId(Integer accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
        Customer customer = customerRepository.findByAccount_Id(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng cho tài khoản ID: " + accountId));

        return mapToProfileResponseDTO(account, customer);
    }

    @Override
    @Transactional // Rất quan trọng! Đảm bảo cả 2 bảng được cập nhật hoặc không có gì cả.
    public ProfileResponseDTO updateProfile(Integer accountId, ProfileUpdateRequestDTO dto) {
        // 1. Lấy các entity hiện có từ DB
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
        Customer customer = customerRepository.findByAccount_Id(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng cho tài khoản ID: " + accountId));

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