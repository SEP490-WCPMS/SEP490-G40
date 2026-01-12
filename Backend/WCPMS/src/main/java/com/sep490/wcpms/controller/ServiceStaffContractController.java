package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import com.sep490.wcpms.service.ServiceStaffContractService;
import com.sep490.wcpms.service.impl.ContractPdfStampService;
import com.sep490.wcpms.service.impl.InstallationAcceptancePdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import com.sep490.wcpms.service.CustomerFeedbackService;
import org.springframework.security.core.Authentication;
import com.sep490.wcpms.exception.AccessDeniedException;
import java.util.List;
import java.util.Map;
import java.time.LocalDate; // for request param/body
import java.util.HashMap;

@RestController
@RequestMapping("/api/service/contracts")
@RequiredArgsConstructor
public class ServiceStaffContractController {

    private final ServiceStaffContractService service;
    private final CustomerFeedbackService customerFeedbackService; // Inject service feedback
    private final ContractPdfStampService contractPdfStampService;
    private final InstallationAcceptancePdfService installationAcceptancePdfService;

    // === HÀM HELPER LẤY ID (Giữ nguyên) ===
    private Integer getAuthenticatedStaffId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getId();
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

    @GetMapping("/{id:\\d+}")
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

//    /**
//     * Hủy/Chấm dứt hợp đồng ACTIVE (chuyển sang TERMINATED)
//     * PUT /api/service/contracts/{id}/terminate
//     * Payload: { "reason": "Lý do hủy" }
//     */
//    @PutMapping("/{id}/terminate")
//    public ServiceStaffContractDTO terminateContract(
//            @PathVariable Integer id,
//            @RequestParam String reason) {
//        return service.terminateContract(id, reason);
//    }

    // === API CHO TAB ANNUL & TRANSFER (TÁCH RIÊNG) ===

    /**
     * Lấy danh sách yêu cầu HỦY hợp đồng
     * GET /api/service/contracts/pending-annul-requests?keyword=...&page=0&size=10
     * API chuyên biệt, gọi trực tiếp từ service
     * Đã ORDER BY r.id ASC trong repository
     */
    @GetMapping({"/annul-requests", "/pending-annul-requests"})
    public Page<ContractAnnulTransferRequestDTO> getAnnulRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatus, // Nhận List
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getAnnulRequests(keyword, PageRequest.of(page, size), approvalStatus);
    }

    /**
     * Lấy danh sách yêu cầu CHUYỂN NHƯỢNG hợp đồng
     * GET /api/service/contracts/pending-transfer-requests?keyword=...&page=0&size=10
     * API chuyên biệt, gọi trực tiếp từ service
     * Đã ORDER BY r.id ASC trong repository
     */
    @GetMapping({"/transfer-requests", "/pending-transfer-requests"})
    public Page<ContractAnnulTransferRequestDTO> getTransferRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<ContractAnnulTransferRequest.ApprovalStatus> approvalStatus, // Nhận List
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.getTransferRequests(keyword, PageRequest.of(page, size), approvalStatus);
    }

    /**
     * Duyệt yêu cầu hủy/chuyển nhượng hợp đồng
     * PUT /api/service/contracts/pending-annul-transfer-requests/{requestId}/approve
     */
    @PutMapping("/pending-annul-transfer-requests/{requestId}/approve")
    public ResponseEntity<ContractAnnulTransferRequestDTO> approveAnnulTransferRequest(
            @PathVariable Integer requestId
    ) {
        ContractAnnulTransferRequestDTO result = service.approveAnnulTransferRequest(requestId);
        return ResponseEntity.ok(result);
    }

    /**
     * Từ chối yêu cầu hủy/chuyển nhượng hợp đồng
     * PUT /api/service/contracts/pending-annul-transfer-requests/{requestId}/reject
     */
    @PutMapping("/pending-annul-transfer-requests/{requestId}/reject")
    public ResponseEntity<ContractAnnulTransferRequestDTO> rejectAnnulTransferRequest(
            @PathVariable Integer requestId,
            @RequestBody Map<String, String> body // <-- Sửa từ @RequestParam thành @RequestBody
    ) {
        String reason = body.get("reason");
        ContractAnnulTransferRequestDTO result = service.rejectAnnulTransferRequest(requestId, reason);
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy chi tiết yêu cầu hủy/chuyển nhượng theo ID
     * GET /api/service/contracts/pending-annul-transfer-requests/{requestId}
     */
    @GetMapping("/pending-annul-transfer-requests/{requestId}")
    public ResponseEntity<ContractAnnulTransferRequestDTO> getAnnulTransferRequestDetail(@PathVariable Integer requestId) {
        // Gọi hàm service (bạn đã thêm hàm này vào ServiceImpl ở bước trước)
        ContractAnnulTransferRequestDTO dto = service.getAnnulTransferRequestDetail(requestId);
        return ResponseEntity.ok(dto);
    }

    // === HẾT PHẦN API ANNUL/TRANSFER ===

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
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "submittedDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Integer currentStaffId = getAuthenticatedStaffId();
        Page<SupportTicketDTO> tickets = service.getSupportTickets(currentStaffId, type, keyword, pageable);
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
     * Gửi khách hàng ký
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

    // ===== PDF DOWNLOAD (SERVICE STAFF) =====

    /**
     * Tải PDF Hợp đồng (Service Staff).
     * GET /api/service/contracts/{contractId}/pdf
     */
    @GetMapping("/{contractId}/pdf")
    public ResponseEntity<byte[]> downloadContractPdf(@PathVariable Integer contractId) {
        byte[] pdfBytes = contractPdfStampService.exportForServiceStaff(contractId);
        String filename = "HopDong_" + contractId + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(pdfBytes);
    }

    /**
     * Tải PDF Phiếu nghiệm thu lắp đặt đồng hồ (Service Staff).
     * GET /api/service/contracts/{contractId}/acceptance-pdf
     */
    @GetMapping("/{contractId}/acceptance-pdf")
    public ResponseEntity<byte[]> downloadAcceptancePdf(@PathVariable Integer contractId) {
        byte[] pdfBytes = installationAcceptancePdfService.exportForServiceStaff(contractId);
        String filename = "PhieuNghiemThu_" + contractId + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(pdfBytes);
    }

//    /**
//     * Tạm ngưng hợp đồng ACTIVE
//     * PUT /api/service/contracts/{id}/suspend
//     */
//    @PutMapping("/{id}/suspend")
//    public ServiceStaffContractDTO suspendContract(
//            @PathVariable Integer id,
//            @RequestParam String reason) {
//        return service.suspendContract(id, reason);
//    }
//
//    /**
//     * Kích hoạt lại hợp đồng đã tạm ngưng
//     * PUT /api/service/contracts/{id}/reactivate
//     */
//    @PutMapping("/{id}/reactivate")
//    public ServiceStaffContractDTO reactivateContract(@PathVariable Integer id) {
//        return service.reactivateContract(id);
//    }
}
