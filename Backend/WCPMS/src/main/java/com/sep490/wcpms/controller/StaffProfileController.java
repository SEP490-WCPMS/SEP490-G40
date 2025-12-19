package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.StaffProfileDTO;
import com.sep490.wcpms.dto.ChangePasswordRequestDTO;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.service.ProfileService;
import com.sep490.wcpms.service.StaffProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:5173")
public class StaffProfileController {

    @Autowired
    private StaffProfileService staffProfileService;

    @Autowired
    private ProfileService profileService; // Reuse the same password-change logic

    //Lấy profile của chính người đang đăng nhập (cho Frontend gọi) ---
    @GetMapping("/profile/me")
    public ResponseEntity<?> getMyProfile() {
        try {
            // 1. Lấy thông tin user từ Security Context (Token)
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getPrincipal())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: Bạn chưa đăng nhập");
            }

            // 2. Lấy ID từ UserDetails
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer currentId = userDetails.getId();

            // 3. Gọi Service (Service sẽ tự lấy thêm thông tin Tuyến đọc)
            StaffProfileDTO profile = staffProfileService.getStaffProfile(currentId);

            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi lấy thông tin: " + e.getMessage());
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<StaffProfileDTO> getStaffProfile(@PathVariable Integer id) {
        StaffProfileDTO profile = staffProfileService.getStaffProfile(id);
        return ResponseEntity.ok(profile);
    }

    // Thêm API đổi mật khẩu cho staff/admin giống Customer
    @PostMapping("/change-password/{id}")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @Valid @RequestBody ChangePasswordRequestDTO changePasswordDTO) {
        try {
            profileService.changePassword(id, changePasswordDTO);
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}