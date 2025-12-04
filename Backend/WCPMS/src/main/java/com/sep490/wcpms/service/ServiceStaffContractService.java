package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.AccountDTO; // <-- THÊM
import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.sep490.wcpms.dto.SupportTicketDTO; // <-- THÊM IMPORT
import java.util.List; // <-- THÊM
import com.sep490.wcpms.dto.CustomerSimpleDTO; // <-- Import cho hàm lấy DS KH
import com.sep490.wcpms.dto.*; // Import tất cả DTO
import com.sep490.wcpms.dto.ContractAnnulTransferRequestDTO;

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
     * Tạm ngưng hợp đồng ACTIVE (chuyển sang SUSPENDED)
     */
    ServiceStaffContractDTO suspendContract(Integer contractId, String reason);

    /**
     * Kích hoạt lại hợp đồng SUSPENDED (chuyển sang ACTIVE)
     */
    ServiceStaffContractDTO reactivateContract(Integer contractId);

    /**
     * Hủy/Chấm dứt hợp đồng ACTIVE (chuyển sang TERMINATED)
     */
    ServiceStaffContractDTO terminateContract(Integer contractId, String reason);

    // === THÊM 3 HÀM MỚI CHO BƯỚC 2 ===

    /** Lấy danh sách NV Kỹ thuật (để gán việc) */
    List<AccountDTO> getAvailableTechStaff();

    /** Lấy danh sách Yêu cầu Hỗ trợ (PENDING) */
    Page<SupportTicketDTO> getSupportTickets(Pageable pageable);

    /** Gán ticket cho NV Kỹ thuật và đổi status sang IN_PROGRESS */
    SupportTicketDTO assignTechToTicket(Integer ticketId, Integer technicalStaffId);

    /**
     * Lấy danh sách Khách hàng rút gọn (ID, Tên, Mã).
     * Dùng cho form "Tạo Ticket Hộ Khách Hàng".
     * (Hàm thứ 1 của "Bước 8")
     */
    List<CustomerSimpleDTO> getSimpleCustomerList();

    // --- THÊM HÀM MỚI (Bước 3) ---
    /**
     * NV Dịch vụ trả lời Góp ý (FEEDBACK) của khách hàng.
     * Chuyển trạng thái ticket sang RESOLVED.
     * @param ticketId ID của ticket (Bảng 20)
     * @param dto DTO chứa nội dung trả lời
     * @param staffId ID của NV Dịch vụ đang trả lời (lấy từ token)
     * @return Ticket đã được cập nhật
     */
    SupportTicketDTO submitFeedbackReply(Integer ticketId, FeedbackReplyDTO dto, Integer staffId);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    List<CustomerMeterDTO> getCustomerActiveMetersByCustomerId(Integer customerId);
    // --- HẾT PHẦN THÊM ---

    /** Tạo Hợp đồng Dịch vụ (WaterServiceContract) từ HĐ lắp đặt đã APPROVED */
    ServiceStaffContractDTO generateWaterServiceContract(Integer contractId, Integer priceTypeId, java.time.LocalDate serviceStartDate);

    /** Gửi khách hàng ký: chuyển trạng thái HĐ lắp đặt sang PENDING_SIGN */
    ServiceStaffContractDTO sendContractToCustomerForSign(Integer contractId);

    /** Gửi hợp đồng cho Tech lắp đặt: chuyển trạng thái HĐ lắp đặt sang SIGNED */
    ServiceStaffContractDTO sendContractToInstallation(Integer contractId);

    /** Lấy danh sách hợp đồng PENDING_SIGN (Khách đã ký, chờ gửi tech) */
    Page<ServiceStaffContractDTO> getPendingSignContracts(String keyword, Pageable pageable);

    // === Annul/Transfer Contract Requests Management ===

    /**
     * Lấy danh sách yêu cầu hủy/chuyển nhượng hợp đồng đang PENDING (chờ duyệt)
     */
    Page<ContractAnnulTransferRequestDTO> getPendingAnnulTransferRequests(String keyword, Pageable pageable);

    /**
     * Duyệt yêu cầu hủy/chuyển nhượng hợp đồng: chuyển trạng thái sang APPROVED
     */
    ContractAnnulTransferRequestDTO approveAnnulTransferRequest(Integer requestId);

    /**
     * Từ chối yêu cầu hủy/chuyển nhượng hợp đồng: chuyển trạng thái sang REJECTED, lưu lý do
     */
    ContractAnnulTransferRequestDTO rejectAnnulTransferRequest(Integer requestId, String reason);
}
