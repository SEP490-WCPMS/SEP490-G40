package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ChangePasswordRequestDTO;
import com.sep490.wcpms.dto.ProfileResponseDTO;
import com.sep490.wcpms.dto.ProfileUpdateRequestDTO;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173") // Cho phép front-end ở port 3000 gọi tới
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    // API để lấy thông tin hồ sơ
    // --- SỬA Ở ĐÂY ---
    @GetMapping("/{id}")
    public ResponseEntity<ProfileResponseDTO> getProfile(@PathVariable Integer id) {
        ProfileResponseDTO profile = profileService.getProfileById(id); // Gọi hàm service mới
        return ResponseEntity.ok(profile);
    }

    // --- SỬA Ở ĐÂY ---
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id, @Valid @RequestBody ProfileUpdateRequestDTO updateRequestDTO) {
        ProfileResponseDTO updatedProfile = profileService.updateProfile(id, updateRequestDTO);

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

    // --- THÊM API MỚI: Đổi mật khẩu ---
    @PostMapping("/change-password/{id}")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @Valid @RequestBody ChangePasswordRequestDTO changePasswordDTO) {
        try {
            profileService.changePassword(id, changePasswordDTO);
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            // Trả về lỗi 400 (Bad Request) nếu logic nghiệp vụ thất bại
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}