package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.StaffProfileDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.service.StaffProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.sep490.wcpms.entity.ReadingRoute;
import com.sep490.wcpms.repository.ReadingRouteRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffProfileServiceImpl implements StaffProfileService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ReadingRouteRepository readingRouteRepository;

    @Override
    @Transactional(readOnly = true)
    public StaffProfileDTO getStaffProfile(Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + id));

        // Sử dụng hàm tiện ích trong DTO để chuyển đổi
        StaffProfileDTO dto = StaffProfileDTO.fromEntity(account);

        // Lấy thông tin Tuyến đọc và gán vào DTO
        // Thực hiện nếu là Service Staff (hoặc cứ lấy hết nếu có)
        List<ReadingRoute> routes = readingRouteRepository.findActiveRoutesByServiceStaffId(id);

        if (routes != null && !routes.isEmpty()) {
            // Nối tên các tuyến lại (ví dụ: "Tuyến Việt Trì, Đông Hội")
            String routeNames = routes.stream()
                    .map(ReadingRoute::getRouteName)
                    .collect(Collectors.joining(", "));

            // Gán vào biến dto đã khai báo ở trên
            dto.setRouteName(routeNames);
        } else {
            dto.setRouteName(""); // Hoặc để null tùy frontend xử lý
        }

        // --- Cuối cùng mới trả về kết quả ---
        return dto;
    }
}