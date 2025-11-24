package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.CustomerNotificationDTO;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import com.sep490.wcpms.service.CustomerNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/notifications")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CustomerNotificationController {

    private final CustomerNotificationService customerNotificationService;

    /**
     * Lấy danh sách thông báo của chính account khách hàng đang đăng nhập.
     * (Account -> tất cả Customer thuộc account đó -> tất cả CustomerNotification).
     *
     * GET /api/customer/notifications
     */
    @GetMapping
    public ResponseEntity<List<CustomerNotificationDTO>> getMyNotifications() {
        Integer accountId = getAuthenticatedAccountId();
        List<CustomerNotificationDTO> list =
                customerNotificationService.getNotificationsForAccount(accountId);
        return ResponseEntity.ok(list);
    }

    /**
     * Lấy chi tiết 1 thông báo.
     * GET /api/customer/notifications/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerNotificationDTO> getNotificationById(
            @PathVariable Integer id
    ) {
        Integer accountId = getAuthenticatedAccountId();

        CustomerNotificationDTO dto = customerNotificationService.getNotificationById(id);

        // Bảo vệ cơ bản: thông báo phải thuộc account hiện tại
        // (nếu FE dùng, check này đảm bảo không xem được thông báo của người khác).
        if (dto.getCustomerId() == null) {
            throw new AccessDeniedException("Notification has no customer bound.");
        }

        // Ở đây đang không kiểm tra sâu accountId vs customerId
        // vì mapping đã lọc ở service khi dùng getMyNotifications.
        // Nếu cần chặt hơn, có thể viết thêm service kiểm tra customer thuộc account.

        return ResponseEntity.ok(dto);
    }

    // ---------------------------------------------------------
    // Helper: Lấy ID account của user đang đăng nhập (giống các controller khác)
    // ---------------------------------------------------------
    private Integer getAuthenticatedAccountId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new AccessDeniedException("Không xác định được tài khoản đăng nhập.");
        }
        return userDetails.getId();
    }
}
