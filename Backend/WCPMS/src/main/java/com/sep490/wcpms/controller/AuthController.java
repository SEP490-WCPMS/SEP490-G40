// AuthController.java
package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.RegisterResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.dto.RegisterRequest;
import com.sep490.wcpms.dto.LoginRequest;
import com.sep490.wcpms.dto.LoginResponse;
import com.sep490.wcpms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth") // Đường dẫn gốc cho các API liên quan đến xác thực
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest registerRequest) { // <-- Sửa kiểu trả về
        RegisterResponse response = authService.register(registerRequest);
        // Trả về HTTP 201 Created và DTO
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // API 1: Gửi yêu cầu quên mật khẩu
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        authService.forgotPassword(email);
        return ResponseEntity.ok("Link đặt lại mật khẩu đã được gửi đến email của bạn.");
    }

    // API 2: Đặt lại mật khẩu mới
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.");
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verifyAccount(@RequestParam("token") String token) {
        try {
            authService.verifyAccount(token);
            return ResponseEntity.ok("Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Xác thực thất bại: " + e.getMessage());
        }
    }
}