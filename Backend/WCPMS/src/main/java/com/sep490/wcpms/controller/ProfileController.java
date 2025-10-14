package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.UpdateProfileDTO;
import com.sep490.wcpms.dto.UserProfileDTO;
import com.sep490.wcpms.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile() {
        // Lấy thông tin xác thực của người dùng đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        String currentUsername = authentication.getName();

        UserProfileDTO userProfile = profileService.getUserProfileByUsername(currentUsername);

        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDTO> updateCurrentUserProfile(@RequestBody UpdateProfileDTO updateData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        UserProfileDTO updatedProfile = profileService.updateUserProfile(currentUsername, updateData);

        return ResponseEntity.ok(updatedProfile);
    }


}