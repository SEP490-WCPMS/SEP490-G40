package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.FeedbackCreateRequestDTO;
import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.security.services.UserDetailsImpl; // THAY TÊN ĐÚNG
import com.sep490.wcpms.service.CustomerFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback") // API chung cho Feedback/Ticket
@RequiredArgsConstructor
@CrossOrigin("*")
public class CustomerFeedbackController {

    private final CustomerFeedbackService customerFeedbackService;

    /**
     * API cho "Cách A": Khách hàng (CUSTOMER) tự tạo ticket báo hỏng.
     */
    @PostMapping("/customer")
    public ResponseEntity<SupportTicketDTO> createTicketAsCustomer(@Valid @RequestBody FeedbackCreateRequestDTO dto) {
        Integer customerAccountId = getAuthenticatedUserId(); // Lấy ID của CUSTOMER
        SupportTicketDTO ticket = customerFeedbackService.createTicketAsCustomer(dto, customerAccountId);
        return new ResponseEntity<>(ticket, HttpStatus.CREATED);
    }

    /**
     * API cho "Cách B": NV Dịch vụ (SERVICE_STAFF) tạo ticket hộ khách hàng.
     */
    @PostMapping("/service")
    public ResponseEntity<SupportTicketDTO> createTicketAsServiceStaff(@Valid @RequestBody FeedbackCreateRequestDTO dto) {
        Integer serviceStaffId = getAuthenticatedUserId(); // Lấy ID của SERVICE_STAFF
        SupportTicketDTO ticket = customerFeedbackService.createTicketAsServiceStaff(dto, serviceStaffId);
        return new ResponseEntity<>(ticket, HttpStatus.CREATED);
    }

    // Hàm helper lấy ID user
    private Integer getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl) { // SỬA TÊN NÀY
            return ((UserDetailsImpl) principal).getId(); // SỬA TÊN NÀY
        }
        throw new IllegalStateException("Cannot determine user ID from Principal.");
    }
}
