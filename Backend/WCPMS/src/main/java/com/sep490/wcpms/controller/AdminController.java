package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CustomerResponseDTO;
import com.sep490.wcpms.dto.GuestRequestResponseDTO;
import com.sep490.wcpms.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final AdminService adminService;

    // Lấy danh sách Guest cần duyệt
    @GetMapping("/guest-requests")
    public ResponseEntity<List<GuestRequestResponseDTO>> getPendingGuestRequests() {
        return ResponseEntity.ok(adminService.getPendingGuestRequests());
    }

    // Duyệt Guest -> Tạo Account
    @PostMapping("/guest-requests/{contractId}/approve")
    public ResponseEntity<String> approveGuest(@PathVariable Integer contractId) {
        adminService.approveGuestAndCreateAccount(contractId);
        return ResponseEntity.ok("Đã tạo tài khoản và gửi SMS cho khách hàng thành công!");
    }

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomers() {
        return ResponseEntity.ok(adminService.getAllCustomers());
    }
}