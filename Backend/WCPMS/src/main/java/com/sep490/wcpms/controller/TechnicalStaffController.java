package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.InstallationCompleteRequestDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.service.TechnicalStaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// --- Import các thư viện cần thiết ---
import com.sep490.wcpms.exception.AccessDeniedException; // Hoặc dùng SecurityException
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
// --- THAY DÒNG IMPORT NÀY BẰNG ĐƯỜNG DẪN VÀ TÊN LỚP UserDetails ĐÚNG ---
import com.sep490.wcpms.security.services.UserDetailsImpl; // <-- Sửa ở đây nếu cần

import com.sep490.wcpms.dto.MeterReplacementRequestDTO;
import com.sep490.wcpms.dto.MeterInfoDTO;
import org.springframework.http.HttpStatus;

import com.sep490.wcpms.dto.OnSiteCalibrationDTO;

import java.util.List;

@RestController
@RequestMapping("/api/technical")
@CrossOrigin("*")
public class TechnicalStaffController {

    @Autowired
    private TechnicalStaffService technicalStaffService;

    /**
     * TODO: Thay thế hàm này bằng logic lấy ID từ Spring Security Principal
     */
    // --- HÀM LẤY ID CHUẨN ---
    private Integer getAuthenticatedStaffId() {
        // 1. Lấy đối tượng Authentication từ context bảo mật hiện tại
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 2. Kiểm tra xem người dùng đã được xác thực chưa
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getPrincipal())) {
            // Nếu chưa đăng nhập hoặc là người dùng ẩn danh, ném lỗi
            throw new AccessDeniedException("Người dùng chưa được xác thực. Vui lòng đăng nhập.");
            // Hoặc throw new SecurityException("User is not authenticated.");
        }

        // 3. Lấy đối tượng Principal (chứa thông tin người dùng)
        Object principal = authentication.getPrincipal();

        // 4. Kiểm tra xem Principal có phải là kiểu UserDetails mong đợi không
        // === THAY UserDetailsImpl BẰNG TÊN LỚP ĐÚNG CỦA BẠN ===
        if (principal instanceof UserDetailsImpl) { // <-- Sửa tên lớp ở đây
            // 5. Ép kiểu Principal về đúng lớp UserDetails của bạn
            UserDetailsImpl userDetails = (UserDetailsImpl) principal; // <-- Sửa tên lớp ở đây
            // 6. Gọi hàm getId() để lấy ID (kiểu Integer)
            return userDetails.getId(); // <-- Đảm bảo lớp UserDetails có hàm getId()
        }
        // === HẾT PHẦN CẦN SỬA TÊN LỚP ===

        // 7. Nếu kiểu Principal không đúng như mong đợi, ném lỗi
        System.err.println("Unexpected Principal type found: " + principal.getClass().getName());
        throw new IllegalStateException("Không thể xác định ID người dùng từ Principal.");
    }

    // === API LUỒNG 1: SURVEY & DESIGN ===

    @GetMapping("/survey/contracts")
    public ResponseEntity<List<ContractDetailsDTO>> getAssignedSurveyContracts() {
        Integer staffId = getAuthenticatedStaffId();
        List<ContractDetailsDTO> contracts = technicalStaffService.getAssignedSurveyContracts(staffId);
        return ResponseEntity.ok(contracts);
    }

    @PutMapping("/contracts/{id}/report")
    public ResponseEntity<ContractDetailsDTO> submitSurveyReport(
            @PathVariable Integer id,
            @RequestBody SurveyReportRequestDTO reportDTO) {

        Integer staffId = getAuthenticatedStaffId();
        ContractDetailsDTO updatedContract = technicalStaffService.submitSurveyReport(id, reportDTO, staffId);
        return ResponseEntity.ok(updatedContract);
    }

    // === API LUỒNG 2: INSTALLATION ===

    @GetMapping("/install/contracts")
    public ResponseEntity<List<ContractDetailsDTO>> getAssignedInstallationContracts() {
        Integer staffId = getAuthenticatedStaffId();
        List<ContractDetailsDTO> contracts = technicalStaffService.getAssignedInstallationContracts(staffId);
        return ResponseEntity.ok(contracts);
    }

    /**
     * SỬA LẠI API NÀY: Thêm @RequestBody
     */
    @PutMapping("/contracts/{id}/complete")
    public ResponseEntity<ContractDetailsDTO> markInstallationAsCompleted(
            @PathVariable Integer id,
            @RequestBody InstallationCompleteRequestDTO installDTO) { // <-- SỬA Ở ĐÂY

        Integer staffId = getAuthenticatedStaffId();
        ContractDetailsDTO completedContract = technicalStaffService.markInstallationAsCompleted(
                id, installDTO, staffId); // <-- Truyền DTO vào service

        return ResponseEntity.ok(completedContract);
    }

    // === API CHUNG ===

    @GetMapping("/contracts/{id}")
    public ResponseEntity<ContractDetailsDTO> getContractDetails(@PathVariable Integer id) {
        Integer staffId = getAuthenticatedStaffId();
        ContractDetailsDTO contract = technicalStaffService.getContractDetails(id, staffId);
        return ResponseEntity.ok(contract);
    }

    // --- API MỚI (1): LẤY THÔNG TIN ĐỒNG HỒ CŨ ---
    @GetMapping("/meter-info/{meterCode}")
    public ResponseEntity<MeterInfoDTO> getMeterInfoByCode(@PathVariable String meterCode) {
        Integer staffId = getAuthenticatedStaffId();
        MeterInfoDTO info = technicalStaffService.getMeterInfoByCode(meterCode, staffId);
        return ResponseEntity.ok(info);
    }

    // --- API MỚI (2): XỬ LÝ THAY THẾ ĐỒNG HỒ ---
    @PostMapping("/meter-replacement")
    public ResponseEntity<Void> processMeterReplacement(@RequestBody MeterReplacementRequestDTO dto) {
        Integer staffId = getAuthenticatedStaffId();
        technicalStaffService.processMeterReplacement(dto, staffId);
        return ResponseEntity.status(HttpStatus.CREATED).build(); // 201 Created
    }

    // --- API MỚI CHO KIỂM ĐỊNH TẠI CHỖ ---
    @PostMapping("/calibrate-on-site")
    public ResponseEntity<Void> processOnSiteCalibration(@RequestBody OnSiteCalibrationDTO dto) {
        Integer staffId = getAuthenticatedStaffId();
        technicalStaffService.processOnSiteCalibration(dto, staffId);
        return ResponseEntity.ok().build(); // Trả về 200 OK
    }
}