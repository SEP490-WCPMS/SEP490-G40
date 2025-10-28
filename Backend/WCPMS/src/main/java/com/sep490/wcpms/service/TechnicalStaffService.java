package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.InstallationCompleteRequestDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import java.util.List;

public interface TechnicalStaffService {

    // === LUỒNG 1: SURVEY & DESIGN ===

    /** Lấy danh sách yêu cầu (status=PENDING) gán cho staff */
    List<ContractDetailsDTO> getAssignedSurveyContracts(Integer staffId);

    /** Nộp báo cáo khảo sát (Survey Form) */
    ContractDetailsDTO submitSurveyReport(Integer contractId, SurveyReportRequestDTO reportDTO, Integer staffId);

    // === LUỒNG 2: INSTALLATION ===

    /** Lấy danh sách hợp đồng (status=SIGNED) gán cho staff */
    List<ContractDetailsDTO> getAssignedInstallationContracts(Integer staffId);

    /** Đánh dấu hợp đồng đã hoàn thành lắp đặt (chuyển sang ACTIVE) */
    /** SỬA LẠI HÀM NÀY: Thêm DTO */
    ContractDetailsDTO markInstallationAsCompleted(Integer contractId, InstallationCompleteRequestDTO installDTO, Integer staffId);

    // === CHUNG ===

    /** Lấy chi tiết hợp đồng (dùng chung) */
    ContractDetailsDTO getContractDetails(Integer contractId, Integer staffId);
}