package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.StaffProfileDTO;
import com.sep490.wcpms.dto.ChangePasswordRequestDTO;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.service.ProfileService;
import com.sep490.wcpms.service.StaffProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:5173")
public class StaffProfileController {

    @Autowired
    private StaffProfileService staffProfileService;

    @Autowired
    private ProfileService profileService; // Reuse the same password-change logic

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