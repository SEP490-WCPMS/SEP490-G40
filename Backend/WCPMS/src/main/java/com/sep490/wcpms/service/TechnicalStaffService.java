package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.InstallationCompleteRequestDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.dto.MeterReplacementRequestDTO;
import com.sep490.wcpms.dto.MeterInfoDTO;
import com.sep490.wcpms.dto.OnSiteCalibrationDTO; // Import DTO mới
import com.sep490.wcpms.dto.*; // Import tất cả DTO
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.sep490.wcpms.dto.SupportTicketDetailDTO; // <-- THÊM IMPORT

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

    // --- THÊM 2 HÀM MỚI ---

    /** Lấy thông tin HĐ/Chỉ số cũ dựa trên MÃ đồng hồ CŨ */
    MeterInfoDTO getMeterInfoByCode(String meterCode, Integer staffId);

    /** Xử lý nghiệp vụ thay thế đồng hồ (Hỏng hoặc Kiểm định) */
    void processMeterReplacement(MeterReplacementRequestDTO dto, Integer staffId);

    // --- THÊM HÀM MỚI ---
    /** Ghi nhận kết quả kiểm định đồng hồ tại chỗ */
    void processOnSiteCalibration(OnSiteCalibrationDTO dto, Integer staffId);

    // === THÊM HÀM MỚI CHO BƯỚC 3 ===
    /**
     * Lấy danh sách Yêu cầu Bảo trì (Hỏng, Kiểm định...)
     * đã được gán cho NV Kỹ thuật này (status = IN_PROGRESS).
     */
    Page<SupportTicketDTO> getMyMaintenanceRequests(Integer staffId, Pageable pageable);

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy CHI TIẾT 1 Yêu cầu Bảo trì (ticket)
     * đã được gán cho NV Kỹ thuật này.
     */
    SupportTicketDetailDTO getMyMaintenanceRequestDetail(Integer staffId, Integer ticketId);
    // --- HẾT PHẦN THÊM ---
}
