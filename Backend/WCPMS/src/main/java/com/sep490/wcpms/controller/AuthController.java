// AuthController.java
package com.sep490.wcpms.controller;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.dto.RegisterRequest;
import com.sep490.wcpms.dto.LoginRequest;
import com.sep490.wcpms.dto.LoginResponse;
import com.sep490.wcpms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<Account> register(@RequestBody RegisterRequest registerRequest) {
        Account createdAccount = authService.register(registerRequest);
        // Trả về HTTP 201 Created và thông tin tài khoản (tránh trả về password)
        // Thường nên dùng một DTO riêng cho Register Response
        return new ResponseEntity<>(createdAccount, HttpStatus.CREATED);
    }
}