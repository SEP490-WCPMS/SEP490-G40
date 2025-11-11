package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CreateStaffRequestDTO;
import com.sep490.wcpms.dto.RoleDTO;
import com.sep490.wcpms.dto.StaffAccountResponseDTO;
import com.sep490.wcpms.dto.UpdateStaffRequestDTO;
import com.sep490.wcpms.service.AccountManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/accounts") // Đường dẫn gốc cho Admin
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // Cho phép Front-end
public class AccountManagementController {

    private final AccountManagementService accountService;

    // Lấy danh sách vai trò (cho dropdown)
    @GetMapping("/roles")
    public ResponseEntity<List<RoleDTO>> getAssignableRoles() {
        return ResponseEntity.ok(accountService.getAssignableRoles());
    }

    // (R)EAD - Lấy tất cả tài khoản nhân viên
    @GetMapping
    public ResponseEntity<List<StaffAccountResponseDTO>> getAllStaffAccounts() {
        return ResponseEntity.ok(accountService.getAllStaffAccounts());
    }

    // (R)EAD - Lấy một tài khoản theo ID
    @GetMapping("/{id}")
    public ResponseEntity<StaffAccountResponseDTO> getStaffAccountById(@PathVariable Integer id) {
        return ResponseEntity.ok(accountService.getStaffAccountById(id));
    }

    // (C)REATE - Tạo tài khoản mới
    @PostMapping
    public ResponseEntity<StaffAccountResponseDTO> createStaffAccount(@Valid @RequestBody CreateStaffRequestDTO requestDTO) {
        StaffAccountResponseDTO newAccount = accountService.createStaffAccount(requestDTO);
        return new ResponseEntity<>(newAccount, HttpStatus.CREATED);
    }

    // (U)PDATE - Cập nhật tài khoản
    @PutMapping("/{id}")
    public ResponseEntity<StaffAccountResponseDTO> updateStaffAccount(@PathVariable Integer id, @Valid @RequestBody UpdateStaffRequestDTO requestDTO) {
        return ResponseEntity.ok(accountService.updateStaffAccount(id, requestDTO));
    }

    // (U)PDATE Status (Deactivate/Activate)
    @PutMapping("/{id}/status")
    public ResponseEntity<StaffAccountResponseDTO> setAccountStatus(@PathVariable Integer id, @RequestBody Map<String, Integer> statusPayload) {
        Integer status = statusPayload.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(accountService.setAccountStatus(id, status));
    }
}