package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ServiceStaffContractService {

    Page<ServiceStaffContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable);

    ServiceStaffContractDTO updateContractByServiceStaff(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest);

    ServiceStaffContractDTO getContractDetailById(Integer contractId);

    // === Service Staff Workflow ===

    /**
     * Lấy danh sách hợp đồng DRAFT (Đơn từ khách hàng chưa gửi khảo sát)
     */
    Page<ServiceStaffContractDTO> getDraftContracts(String keyword, Pageable pageable);

    /**
     * Chuyển hợp đồng từ DRAFT sang PENDING (Gửi cho Technical khảo sát)
     */
    ServiceStaffContractDTO submitContractForSurvey(Integer contractId, Integer technicalStaffId);

    /**
     * Lấy danh sách hợp đồng PENDING_SURVEY_REVIEW (Chờ Service Staff duyệt báo cáo khảo sát)
     */
    Page<ServiceStaffContractDTO> getPendingSurveyReviewContracts(String keyword, Pageable pageable);

    /**
     * Duyệt báo cáo khảo sát và chuyển trạng thái sang APPROVED
     */
    ServiceStaffContractDTO approveSurveyReport(Integer contractId);

    /**
     * Lấy danh sách hợp đồng APPROVED (Đã duyệt, chuẩn bị gửi khách ký)
     */
    Page<ServiceStaffContractDTO> getApprovedContracts(String keyword, Pageable pageable);

    // === ACTIVE Contract Management ===

    /**
     * Lấy danh sách hợp đồng ACTIVE (Đang hoạt động)
     */
    Page<ServiceStaffContractDTO> getActiveContracts(String keyword, Pageable pageable);

    /**
     * Cập nhật thông tin hợp đồng ACTIVE (giá, ngày kết thúc, v.v.)
     */
    ServiceStaffContractDTO updateActiveContract(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest);

    /**
     * Gia hạn hợp đồng ACTIVE (kéo dài thời hạn)
     */
    ServiceStaffContractDTO renewContract(Integer contractId, ServiceStaffUpdateContractRequestDTO renewRequest);

    /**
     * Hủy/Chấm dứt hợp đồng ACTIVE (chuyển sang TERMINATED)
     */
    ServiceStaffContractDTO terminateContract(Integer contractId, String reason);
}
