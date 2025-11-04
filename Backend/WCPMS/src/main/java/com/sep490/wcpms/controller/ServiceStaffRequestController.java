package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ApiResponse;
import com.sep490.wcpms.dto.ContractAnnulTransferRequestDTO;
import com.sep490.wcpms.dto.ContractAnnulTransferRequestUpdateDTO;
import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import com.sep490.wcpms.service.ContractAnnulTransferRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.sep490.wcpms.security.services.UserDetailsImpl;

/**
 * Service Staff API để quản lý yêu cầu hủy hợp đồng và chuyển nhượng
 * Endpoint: /api/service/requests
 * 
 * Lưu ý về enum ApprovalStatus:
 * - DTO use Enum: ContractAnnulTransferRequest.ApprovalStatus.PENDING, APPROVED, REJECTED
 * - Specs use String (lowercase): "pending", "approved", "rejected"
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/service/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class ServiceStaffRequestController {

    private final ContractAnnulTransferRequestService service;

    // Helper: Lấy ID NV Dịch vụ từ SecurityContext
    private Integer getAuthenticatedStaffId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    /**
     * Lấy danh sách yêu cầu hủy/chuyển nhượng theo bộ lọc
     * Status: lowercase string ("pending", "approved", "rejected")
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ContractAnnulTransferRequestDTO>>> searchRequests(
            @RequestParam(required = false) Integer contractId,
            @RequestParam(required = false) String requestType, // "annul" | "transfer"
            @RequestParam(required = false) String status,      // "pending" | "approved" | "rejected"
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,DESC") String sort) {

        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        Page<ContractAnnulTransferRequestDTO> result = service.search(
                contractId, requestType, status, from, to, q, pageable);

        return ResponseEntity.ok(
            ApiResponse.<Page<ContractAnnulTransferRequestDTO>>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy danh sách yêu cầu thành công")
                    .build())
                .data(result)
                .build()
        );
    }

    /**
     * Lấy chi tiết một yêu cầu hủy/chuyển nhượng
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContractAnnulTransferRequestDTO>> getRequestDetail(
            @PathVariable Integer id) {

        ContractAnnulTransferRequestDTO dto = service.getById(id);

        return ResponseEntity.ok(
            ApiResponse.<ContractAnnulTransferRequestDTO>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy chi tiết yêu cầu thành công")
                    .build())
                .data(dto)
                .build()
        );
    }

    /**
     * Lấy danh sách yêu cầu đang chờ duyệt (status = "pending")
     */
    @GetMapping("/pending/list")
    public ResponseEntity<ApiResponse<Page<ContractAnnulTransferRequestDTO>>> getPendingRequests(
            @RequestParam(required = false) String requestType, // "annul" | "transfer"
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Status phải là lowercase string
        Page<ContractAnnulTransferRequestDTO> result = service.search(
                null, requestType, "pending", null, null, null, pageable);

        return ResponseEntity.ok(
            ApiResponse.<Page<ContractAnnulTransferRequestDTO>>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy danh sách yêu cầu chờ duyệt thành công")
                    .build())
                .data(result)
                .build()
        );
    }

    /**
     * Duyệt yêu cầu hủy hợp đồng hoặc chuyển nhượng
     * Endpoint: POST /api/service/requests/{id}/approve
     * DTO's approvalStatus là Enum, set thành APPROVED
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ContractAnnulTransferRequestDTO>> approveRequest(
            @PathVariable Integer id,
            @Valid @RequestBody ContractAnnulTransferRequestUpdateDTO dto) {

        try {
            Integer staffId = getAuthenticatedStaffId();
            // Set enum ApprovalStatus
            dto.setApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus.APPROVED);
            dto.setApprovedById(staffId);
            dto.setApprovalDate(LocalDate.now());
            ContractAnnulTransferRequestDTO result = service.updateApproval(id, dto);

            return ResponseEntity.ok(
                ApiResponse.<ContractAnnulTransferRequestDTO>builder()
                    .status(ApiResponse.Status.builder()
                        .code(200)
                        .message("Duyệt yêu cầu thành công")
                        .build())
                    .data(result)
                    .build()
            );
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<ContractAnnulTransferRequestDTO>builder()
                        .status(ApiResponse.Status.builder()
                            .code(400)
                            .message("Duyệt yêu cầu thất bại: " + e.getMessage())
                            .build())
                        .build());
        }
    }

    /**
     * Từ chối yêu cầu hủy hợp đồng hoặc chuyển nhượng
     * Endpoint: POST /api/service/requests/{id}/reject
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ContractAnnulTransferRequestDTO>> rejectRequest(
            @PathVariable Integer id,
            @Valid @RequestBody ContractAnnulTransferRequestUpdateDTO dto) {

        try {
            Integer staffId = getAuthenticatedStaffId();
            // Set enum ApprovalStatus
            dto.setApprovalStatus(ContractAnnulTransferRequest.ApprovalStatus.REJECTED);
            dto.setApprovedById(staffId);
            dto.setApprovalDate(LocalDate.now());
            ContractAnnulTransferRequestDTO result = service.updateApproval(id, dto);

            return ResponseEntity.ok(
                ApiResponse.<ContractAnnulTransferRequestDTO>builder()
                    .status(ApiResponse.Status.builder()
                        .code(200)
                        .message("Từ chối yêu cầu thành công")
                        .build())
                    .data(result)
                    .build()
            );
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<ContractAnnulTransferRequestDTO>builder()
                        .status(ApiResponse.Status.builder()
                            .code(400)
                            .message("Từ chối yêu cầu thất bại: " + e.getMessage())
                            .build())
                        .build());
        }
    }

    /**
     * Lấy danh sách yêu cầu HỦY hợp đồng chờ duyệt
     */
    @GetMapping("/annul/pending")
    public ResponseEntity<ApiResponse<Page<ContractAnnulTransferRequestDTO>>> getPendingCancellations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Status: lowercase
        Page<ContractAnnulTransferRequestDTO> result = service.search(
                null, "annul", "pending", null, null, null, pageable);

        return ResponseEntity.ok(
            ApiResponse.<Page<ContractAnnulTransferRequestDTO>>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy danh sách yêu cầu hủy chờ duyệt thành công")
                    .build())
                .data(result)
                .build()
        );
    }

    /**
     * Lấy danh sách yêu cầu CHUYỂN NHƯỢNG chờ duyệt
     */
    @GetMapping("/transfer/pending")
    public ResponseEntity<ApiResponse<Page<ContractAnnulTransferRequestDTO>>> getPendingTransfers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Status: lowercase
        Page<ContractAnnulTransferRequestDTO> result = service.search(
                null, "transfer", "pending", null, null, null, pageable);

        return ResponseEntity.ok(
            ApiResponse.<Page<ContractAnnulTransferRequestDTO>>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy danh sách yêu cầu chuyển nhượng chờ duyệt thành công")
                    .build())
                .data(result)
                .build()
        );
    }

    /**
     * Lấy danh sách yêu cầu HỦY đã được DUYỆT
     */
    @GetMapping("/annul/approved")
    public ResponseEntity<ApiResponse<Page<ContractAnnulTransferRequestDTO>>> getApprovedCancellations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "approvalDate"));
        // Status: lowercase
        Page<ContractAnnulTransferRequestDTO> result = service.search(
                null, "annul", "approved", null, null, null, pageable);

        return ResponseEntity.ok(
            ApiResponse.<Page<ContractAnnulTransferRequestDTO>>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy danh sách yêu cầu hủy đã duyệt thành công")
                    .build())
                .data(result)
                .build()
        );
    }

    /**
     * Lấy danh sách yêu cầu CHUYỂN NHƯỢNG đã được DUYỆT
     */
    @GetMapping("/transfer/approved")
    public ResponseEntity<ApiResponse<Page<ContractAnnulTransferRequestDTO>>> getApprovedTransfers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "approvalDate"));
        // Status: lowercase
        Page<ContractAnnulTransferRequestDTO> result = service.search(
                null, "transfer", "approved", null, null, null, pageable);

        return ResponseEntity.ok(
            ApiResponse.<Page<ContractAnnulTransferRequestDTO>>builder()
                .status(ApiResponse.Status.builder()
                    .code(200)
                    .message("Lấy danh sách yêu cầu chuyển nhượng đã duyệt thành công")
                    .build())
                .data(result)
                .build()
        );
    }

    /**
     * Parse sort parameter
     * Format: "field,ASC" hoặc "field,DESC"
     */
    private Sort parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sortParam.split(",");
        String field = parts[0].trim();
        Sort.Direction dir = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("ASC"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }
}
