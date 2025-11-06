// src/main/java/com/sep490/wcpms/controller/MeterReadingController.java
package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.MeterReadingSaveDTO;
import com.sep490.wcpms.dto.ReadingConfirmationDTO;
import com.sep490.wcpms.service.MeterReadingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // <-- Import
import org.springframework.security.core.context.SecurityContextHolder; // <-- Import
import com.sep490.wcpms.exception.AccessDeniedException; // <-- Import
import com.sep490.wcpms.security.services.UserDetailsImpl; // <-- Import (Giả định)
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/readings")
@CrossOrigin(origins = "http://localhost:5173") // Cho phép FE
public class MeterReadingController {

    @Autowired
    private MeterReadingService meterReadingService;

    /**
     * SỬA LẠI API NÀY
     * Lấy thông tin Hợp đồng và Chỉ số cũ BẰNG MÃ ĐỒNG HỒ (meterCode)
     */
    @GetMapping("/confirm-data/by-meter/{meterCode}")
    public ResponseEntity<ReadingConfirmationDTO> getConfirmationData(@PathVariable String meterCode) {
        ReadingConfirmationDTO data = meterReadingService.getConfirmationDataByMeterCode(meterCode);
        return ResponseEntity.ok(data);
    }

    /**
     * API Lưu chỉ số mới (Gửi Kế toán)
     */
    @PostMapping("/save")
    public ResponseEntity<String> saveNewReading(@RequestBody MeterReadingSaveDTO dto) {
        Integer readerId = getAuthenticatedStaffId(); // Lấy ID nhân viên đang đăng nhập
        meterReadingService.saveNewReading(dto, readerId);
        return ResponseEntity.ok("Đã lưu chỉ số mới thành công.");
    }

    /**
     * Hàm lấy ID nhân viên đã đăng nhập (Giống hệt bên TechnicalStaffController)
     */
    private Integer getAuthenticatedStaffId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated. Please log in.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getId();
        }
        throw new IllegalStateException("Cannot determine user ID from Principal.");
    }
}