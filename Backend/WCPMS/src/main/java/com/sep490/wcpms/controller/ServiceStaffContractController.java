package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/service/contracts")
@RequiredArgsConstructor
public class ServiceStaffContractController {

    private final ServiceStaffContractService service;

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
}
