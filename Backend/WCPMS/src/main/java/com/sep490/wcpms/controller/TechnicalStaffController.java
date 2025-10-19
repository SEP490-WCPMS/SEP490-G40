package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.service.TechnicalStaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technical")
// @CrossOrigin("*") // Thêm nếu cần
public class TechnicalStaffController {

    @Autowired
    private TechnicalStaffService technicalStaffService;

    /**
     * TODO: Thay thế hàm này bằng logic lấy ID từ Spring Security Principal
     */
    private Integer getAuthenticatedStaffId() {
        // Ví dụ: return ((UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getId();
        return 1; // <<<<< HARDCODE ĐỂ TEST - CẦN THAY THẾ
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

    @PutMapping("/contracts/{id}/complete")
    public ResponseEntity<ContractDetailsDTO> markInstallationAsCompleted(@PathVariable Integer id) {
        Integer staffId = getAuthenticatedStaffId();
        ContractDetailsDTO completedContract = technicalStaffService.markInstallationAsCompleted(id, staffId);
        return ResponseEntity.ok(completedContract);
    }

    // === API CHUNG ===

    @GetMapping("/contracts/{id}")
    public ResponseEntity<ContractDetailsDTO> getContractDetails(@PathVariable Integer id) {
        Integer staffId = getAuthenticatedStaffId();
        ContractDetailsDTO contract = technicalStaffService.getContractDetails(id, staffId);
        return ResponseEntity.ok(contract);
    }
}