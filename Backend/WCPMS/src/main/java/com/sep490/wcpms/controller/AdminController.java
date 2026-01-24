package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.BulkCreateGuestAccoutResponseDTO;
import com.sep490.wcpms.dto.ContractDetailsDTO;
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
    // Duyệt hàng loạt Guest -> Tạo Account hàng loạt
    // POST /api/admin/guest-requests/bulk-approve
    // Body: [1, 2, 3] (Danh sách contractId)
    @PostMapping("/guest-requests/bulk-approve")
    public ResponseEntity<BulkCreateGuestAccoutResponseDTO> bulkApproveGuests(@RequestBody List<Integer> contractIds) {
        return ResponseEntity.ok(adminService.bulkApproveGuestAndCreateAccounts(contractIds));
    }


    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomers() {
        return ResponseEntity.ok(adminService.getAllCustomers());
    }

    @GetMapping("/customers/{customerId}/contracts")
    public ResponseEntity<List<ContractDetailsDTO>> getCustomerContracts(@PathVariable Integer customerId) {
        return ResponseEntity.ok(adminService.getContractsByCustomerId(customerId));
    }

    // API lấy số lượng yêu cầu Guest cần xử lý (cho Badge trên Menu)
    @GetMapping("/guest-requests/count")
    public ResponseEntity<Long> getGuestRequestsCount() {
        long count = adminService.countPendingGuestRequests();
        return ResponseEntity.ok(count);
    }

    // API lấy Customer ID theo Contract ID (dùng cho highlight notification)
    @GetMapping("/contracts/{contractId}/customer-id")
    public ResponseEntity<Integer> getCustomerIdByContractId(@PathVariable Integer contractId) {
        Integer customerId = adminService.getCustomerIdByContractId(contractId);
        return ResponseEntity.ok(customerId); // Trả về null nếu chưa có customer
    }
}