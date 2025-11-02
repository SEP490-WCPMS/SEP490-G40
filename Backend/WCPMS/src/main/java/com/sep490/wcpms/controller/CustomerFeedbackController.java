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
import org.springframework.data.domain.Page; // <-- THÊM IMPORT
import org.springframework.data.domain.Pageable; // <-- THÊM IMPORT
import org.springframework.data.web.PageableDefault; // <-- THÊM IMPORT
import org.springframework.data.domain.Sort; // <-- THÊM IMPORT

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

    // --- THÊM 2 API MỚI ---

    /**
     * API cho "Cách A": Khách hàng (CUSTOMER) lấy danh sách ticket CỦA MÌNH.
     * Path: GET /api/feedback/customer/my-tickets
     */
    @GetMapping("/customer/my-tickets")
    public ResponseEntity<Page<SupportTicketDTO>> getMyTickets(
            @PageableDefault(size = 10, sort = "submittedDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Integer customerAccountId = getAuthenticatedUserId();
        Page<SupportTicketDTO> tickets = customerFeedbackService.getMyTickets(customerAccountId, pageable);
        return ResponseEntity.ok(tickets);
    }

    /**
     * API cho "Cách A": Khách hàng (CUSTOMER) xem chi tiết 1 ticket CỦA MÌNH.
     * Path: GET /api/feedback/customer/my-tickets/{ticketId}
     */
    @GetMapping("/customer/my-tickets/{ticketId}")
    public ResponseEntity<SupportTicketDTO> getMyTicketDetail(
            @PathVariable Integer ticketId
    ) {
        Integer customerAccountId = getAuthenticatedUserId();
        SupportTicketDTO ticket = customerFeedbackService.getMyTicketDetail(customerAccountId, ticketId);
        return ResponseEntity.ok(ticket);
    }
    // --- HẾT PHẦN THÊM ---
}
