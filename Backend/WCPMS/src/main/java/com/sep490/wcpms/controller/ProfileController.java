package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ProfileResponseDTO;
import com.sep490.wcpms.dto.ProfileUpdateRequestDTO;
import com.sep490.wcpms.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000") // Cho phép front-end ở port 3000 gọi tới
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    // API để lấy thông tin hồ sơ
    @GetMapping("/{accountId}")
    public ResponseEntity<ProfileResponseDTO> getProfile(@PathVariable Long accountId) {
        ProfileResponseDTO profile = profileService.getProfileByAccountId(accountId);
        return ResponseEntity.ok(profile);
    }

    // API để cập nhật thông tin hồ sơ
    @PutMapping("/update/{accountId}")
    // **THAY ĐỔI 1: Đổi kiểu trả về thành ResponseEntity<?> hoặc ResponseEntity<Map<String, Object>>**
    public ResponseEntity<?> updateProfile(@PathVariable Long accountId, @Valid @RequestBody ProfileUpdateRequestDTO updateRequestDTO) {
        ProfileResponseDTO updatedProfile = profileService.updateProfile(accountId, updateRequestDTO);

        // **THAY ĐỔI 2: Tạo một Map để bao bọc response**
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("user", updatedProfile);

        return ResponseEntity.ok(responseBody);
    }

    // Lớp nội bộ để bao bọc response cho giống với yêu cầu của front-end
    private static class UserUpdateWrapper {
        public ProfileResponseDTO user;

        public UserUpdateWrapper(ProfileResponseDTO user) {
            this.user = user;
        }
    }
}