package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.StaffProfileDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.service.StaffProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StaffProfileServiceImpl implements StaffProfileService {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public StaffProfileDTO getStaffProfile(Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));

        // Sử dụng hàm tiện ích trong DTO để chuyển đổi
        return StaffProfileDTO.fromEntity(account);
    }
}