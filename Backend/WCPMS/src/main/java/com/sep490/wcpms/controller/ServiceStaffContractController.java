package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// --- CÁC IMPORT BỊ THIẾU ---
import org.springframework.data.domain.Pageable; // <-- Bị thiếu
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault; // <-- Bị thiếu
import org.springframework.http.ResponseEntity; // <-- Bị thiếu
import com.sep490.wcpms.service.CustomerFeedbackService;
import org.springframework.security.core.Authentication;
import com.sep490.wcpms.exception.AccessDeniedException;
import java.util.List;
import java.util.Map;
import java.time.LocalDate; // for request param/body
import java.util.HashMap;
// --- HẾT PHẦN IMPORT ---

@RestController
@RequestMapping("/api/service/contracts")
@RequiredArgsConstructor
public class ServiceStaffContractController {

    private final ServiceStaffContractService service;
    private final CustomerFeedbackService customerFeedbackService; // Inject service feedback

    // === HÀM HELPER LẤY ID (Giữ nguyên) ===
    private Integer getAuthenticatedStaffId() {
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

    @GetMapping
    public Page<ServiceStaffContractDTO> listContracts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.findContractsForServiceStaff(status, keyword, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public ServiceStaffContractDTO getContract(@PathVariable Integer id) {
        return service.getContractDetailById(id);
    }

    @PutMapping("/{id}")
    public ServiceStaffContractDTO updateContract(
            @PathVariable Integer id,
            @RequestBody ServiceStaffUpdateContractRequestDTO updateRequest) {
        return service.updateContractByServiceStaff(id, updateRequest);
    }

    // ===== Service Staff Workflow Endpoints =====

    /**
     * Màn 1: Lấy danh sách hợp đồng DRAFT (Đơn từ khách hàng)
     * GET /api/service/contracts/draft?keyword=...&page=0&size=10
     */
    @GetMapping("/draft")
    public Page<ServiceStaffContractDTO> getDraftContracts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getDraftContracts(keyword, PageRequest.of(page, size));
    }
    /**
     * Màn 1: Gửi hợp đồng cho Technical khảo sát (DRAFT → PENDING)
     * PUT /api/service/contracts/{id}/submit
     */
    @PutMapping("/{id}/submit")
    public ServiceStaffContractDTO submitContractForSurvey(
            @PathVariable Integer id,
            @RequestBody ServiceStaffUpdateContractRequestDTO request) {
        return service.submitContractForSurvey(id, request.getTechnicalStaffId());
    }

    /**
     * Màn 2: Lấy danh sách hợp đồng PENDING_SURVEY_REVIEW (Chờ duyệt báo cáo khảo sát)
     * GET /api/service/contracts/pending-survey-review?keyword=...&page=0&size=10
     */
    @GetMapping("/pending-survey-review")
    public Page<ServiceStaffContractDTO> getPendingSurveyReviewContracts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getPendingSurveyReviewContracts(keyword, PageRequest.of(page, size));
    }

    /**
     * Màn 2: Duyệt báo cáo khảo sát (PENDING_SURVEY_REVIEW → APPROVED)
     * PUT /api/service/contracts/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ServiceStaffContractDTO approveSurveyReport(@PathVariable Integer id) {
        return service.approveSurveyReport(id);
    }

    /**
     * Lấy danh sách hợp đồng APPROVED (Đã duyệt, chuẩn bị gửi khách ký)
     * GET /api/service/contracts/approved?keyword=...&page=0&size=10
     */
    @GetMapping("/approved")
    public Page<ServiceStaffContractDTO> getApprovedContracts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getApprovedContracts(keyword, PageRequest.of(page, size));
    }

    // === ACTIVE Contract Management ===

    /**
     * Lấy danh sách hợp đồng ACTIVE (Đang hoạt động)
     * GET /api/service/contracts/active?keyword=...&page=0&size=10
     */
    @GetMapping("/active")
    public Page<ServiceStaffContractDTO> getActiveContracts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getActiveContracts(keyword, PageRequest.of(page, size));
    }

    /**
     * Cập nhật thông tin hợp đồng ACTIVE (giá, ngày kết thúc, v.v.)
     * PUT /api/service/contracts/{id}/update-active
     */
    @PutMapping("/{id}/update-active")
    public ServiceStaffContractDTO updateActiveContract(
            @PathVariable Integer id,
            @RequestBody ServiceStaffUpdateContractRequestDTO updateRequest) {
        return service.updateActiveContract(id, updateRequest);
    }

    /**
     * Gia hạn hợp đồng ACTIVE (kéo dài thời hạn)
     * PUT /api/service/contracts/{id}/renew
     */
    @PutMapping("/{id}/renew")
    public ServiceStaffContractDTO renewContract(
            @PathVariable Integer id,
            @RequestBody ServiceStaffUpdateContractRequestDTO renewRequest) {
        return service.renewContract(id, renewRequest);
    }

    /**
     * Hủy/Chấm dứt hợp đồng ACTIVE (chuyển sang TERMINATED)
     * PUT /api/service/contracts/{id}/terminate
     * Payload: { "reason": "Lý do hủy" }
     */
    @PutMapping("/{id}/terminate")
    public ServiceStaffContractDTO terminateContract(
            @PathVariable Integer id,
            @RequestParam String reason) {
        return service.terminateContract(id, reason);
    }


    // === API MỚI CHO BƯỚC 2 (Quản lý Ticket) ===
    // (Lưu ý: Các API này sẽ có đường dẫn là /api/service/contracts/...)

    /**
     * API Lấy danh sách NV Kỹ thuật (để điền vào dropdown gán việc).
     * Path: GET /api/service/contracts/accounts/technical-staff
     */
    @GetMapping("/accounts/technical-staff")
    public ResponseEntity<List<AccountDTO>> getAvailableTechStaff() {
        // --- SỬA LỖI TẠI ĐÂY ---
        List<AccountDTO> techStaff = service.getAvailableTechStaff(); // Dùng 'service'
        return ResponseEntity.ok(techStaff);
    }

    /**
     * API Lấy danh sách Yêu cầu Hỗ trợ (Tickets) đang chờ xử lý (PENDING).
     * Path: GET /api/service/contracts/support-tickets
     */
    @GetMapping("/support-tickets")
    public ResponseEntity<Page<SupportTicketDTO>> getSupportTickets(
            @RequestParam(required = false) List<String> type, // Nhận 1 hoặc nhiều type
            @PageableDefault(size = 10, sort = "submittedDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        // --- SỬA LỖI TẠI ĐÂY ---
        Page<SupportTicketDTO> tickets = service.getSupportTickets(type, pageable); // Dùng 'service'
        return ResponseEntity.ok(tickets);
    }

    /**
     * API Gán một ticket cho NV Kỹ thuật.
     * Path: PUT /api/service/contracts/support-tickets/{ticketId}/assign
     */
    @PutMapping("/support-tickets/{ticketId}/assign")
    public ResponseEntity<SupportTicketDTO> assignTechToTicket(
            @PathVariable Integer ticketId,
            @RequestBody Map<String, Integer> payload
    ) {
        Integer technicalStaffId = payload.get("technicalStaffId");
        if (technicalStaffId == null) {
            throw new IllegalArgumentException("Missing 'technicalStaffId' in request body.");
        }
        // --- SỬA LỖI TẠI ĐÂY ---
        SupportTicketDTO assignedTicket = service.assignTechToTicket(ticketId, technicalStaffId); // Dùng 'service'
        return ResponseEntity.ok(assignedTicket);
    }

    // === THÊM API MỚI (Bước 5) ===

    /**
     * API Trả lời ticket Góp ý (FEEDBACK)
     * Path: PUT /api/service/support-tickets/{ticketId}/reply
     * Body: { "responseContent": "..." }
     */
    @PutMapping("/support-tickets/{ticketId}/reply")
    public ResponseEntity<SupportTicketDTO> submitFeedbackReply(
            @PathVariable Integer ticketId,
            @RequestBody FeedbackReplyDTO dto // Dùng DTO mới
    ) {
        Integer staffId = getAuthenticatedStaffId(); // Lấy ID NV Dịch vụ
        SupportTicketDTO resolvedTicket = service.submitFeedbackReply(ticketId, dto, staffId);
        return ResponseEntity.ok(resolvedTicket);
    }
    // --- HẾT PHẦN THÊM ---


    // === API MỚI CHO "CÁCH B" (Bước 8) ===

    /**
     * API Lấy danh sách Khách hàng rút gọn (để tạo ticket hộ).
     * Path: GET /api/service/customers/simple-list
     */
    @GetMapping("/customers/simple-list")
    public ResponseEntity<List<CustomerSimpleDTO>> getSimpleCustomerList() {
        List<CustomerSimpleDTO> customers = service.getSimpleCustomerList();
        return ResponseEntity.ok(customers);
    }

    // --- THÊM API MỚI ---
    /**
     * API Lấy danh sách đồng hồ ACTIVE của một Khách hàng CỤ THỂ
     * (Dùng cho form "Tạo Ticket Hộ Khách Hàng").
     * Path: GET /api/service/customers/{customerId}/active-meters
     */
    @GetMapping("/customers/active-meters/{customerId}")
    public ResponseEntity<List<CustomerMeterDTO>> getCustomerActiveMeters(
            @PathVariable Integer customerId
    ) {
        // Chúng ta cần thêm hàm này vào CustomerFeedbackService (hoặc ServiceStaffContractService)
        // Giả sử chúng ta thêm nó vào CustomerFeedbackService (vì nó liên quan đến Customer)

        // Tìm Account ID của khách hàng (Cách 1: nếu Customer entity có accountId)
        // Customer customer = customerRepository.findById(customerId)...
        // Integer customerAccountId = customer.getAccount().getId();
        // (Cách 2: Giả sử CustomerFeedbackService đã có hàm lấy theo customerId)

        // TẠM THỜI, chúng ta cần một hàm mới trong CustomerFeedbackService
        // Hãy tạo hàm getCustomerActiveMetersByCustomerId(Integer customerId)

        // (Giả sử CustomerFeedbackService đã có hàm getCustomerActiveMeters(Integer customerAccountId)
        // và chúng ta cần tìm accountId từ customerId)
        // Tạm thời gọi hàm cũ (nhưng hàm này lấy theo AccountID, không phải CustomerID)

        // SỬA LẠI: Chúng ta cần một hàm mới trong Service/Repo
        // Giả sử ServiceStaffContractService có hàm này:
        List<CustomerMeterDTO> meters = service.getCustomerActiveMetersByCustomerId(customerId);
        return ResponseEntity.ok(meters);
    }
    // --- HẾT PHẦN THÊM ---

    /**
     * Tạo Hợp đồng Dịch vụ (WaterServiceContract) từ HĐ lắp đặt đã APPROVED
     * POST /api/service/contracts/{id}/generate-water-service-contract
     * Body: { "priceTypeId": 1, "serviceStartDate": "2025-01-01" }
     */
    @PostMapping("/{id}/generate-water-service-contract")
    public ResponseEntity<ServiceStaffContractDTO> generateWaterServiceContract(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body
    ) {
        Integer priceTypeId = body.get("priceTypeId") instanceof Number ? ((Number) body.get("priceTypeId")).intValue() : null;
        LocalDate serviceStartDate = null;
        Object ssd = body.get("serviceStartDate");
        if (ssd instanceof String str && !str.isBlank()) {
            serviceStartDate = LocalDate.parse(str);
        }
        if (priceTypeId == null) {
            throw new IllegalArgumentException("priceTypeId is required");
        }
        ServiceStaffContractDTO dto = service.generateWaterServiceContract(id, priceTypeId, serviceStartDate);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Gửi khách hàng ký: chuyển HĐ lắp đặt sang PENDING_SIGN
     * PUT /api/service/contracts/{id}/send-to-sign
     */
    @PutMapping("/{id}/send-to-sign")
    public ResponseEntity<ServiceStaffContractDTO> sendToCustomerSign(@PathVariable Integer id) {
        ServiceStaffContractDTO dto = service.sendContractToCustomerForSign(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * Lấy danh sách hợp đồng PENDING_SIGN (Khách đã ký, chờ gửi tech lắp đặt)
     * GET /api/service/contracts/pending-sign?keyword=...&page=0&size=10
     */
    @GetMapping("/pending-sign")
    public Page<ServiceStaffContractDTO> getPendingSignContracts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getPendingSignContracts(keyword, PageRequest.of(page, size));
    }

    /**
     * Gửi hợp đồng cho Tech lắp đặt (PENDING_CUSTOMER_SIGN → SIGNED)
     * PUT /api/service/contracts/{id}/send-to-installation
     */
    @PutMapping("/{id}/send-to-installation")
    public ResponseEntity<ServiceStaffContractDTO> sendToInstallation(@PathVariable Integer id) {
        ServiceStaffContractDTO dto = service.sendContractToInstallation(id);
        return ResponseEntity.ok(dto);
    }

    // THÊM API TẠM NGƯNG
    @PutMapping("/{id}/suspend")
    public ServiceStaffContractDTO suspendContract(
            @PathVariable Integer id,
            @RequestParam String reason) {
        return service.suspendContract(id, reason);
    }

    // THÊM API KÍCH HOẠT LẠI
    @PutMapping("/{id}/reactivate")
    public ServiceStaffContractDTO reactivateContract(@PathVariable Integer id) {
        return service.reactivateContract(id);
    }
}
