package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.ContractUsageDetail; // Để lấy priceType
import lombok.Data;
import lombok.NoArgsConstructor; // Thêm cái này để tránh lỗi framework

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor // Cần thiết cho Jackson (JSON parsing)
public class ContractDetailsDTO {
    private Integer id;
    private String contractNumber;
    private Contract.ContractStatus contractStatus;
    private LocalDate applicationDate;

    // Thông tin khách hàng
    private Integer customerId;
    private String customerName;
    private String customerAddress;
    private String customerPhone; // <--- 1. THÊM TRƯỜNG NÀY

    // Thông tin kỹ thuật (từ Survey Form)
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;

    // Thông tin bổ sung
    private String priceTypeName;
    private String routeName;

    // Thông tin kỹ thuật viên
    private Integer technicalStaffId;
    private String technicalStaffName;

    // =========================================================================
    // 2. THÊM CONSTRUCTOR ĐỂ XỬ LÝ LOGIC GUEST VS USER
    // =========================================================================
    public ContractDetailsDTO(Contract contract) {
        this.id = contract.getId();
        this.contractNumber = contract.getContractNumber();
        this.contractStatus = contract.getContractStatus();
        this.applicationDate = (contract.getCreatedAt() != null) ? contract.getCreatedAt().toLocalDate() : null;
        this.surveyDate = contract.getSurveyDate();
        this.technicalDesign = contract.getTechnicalDesign();
        this.estimatedCost = contract.getEstimatedCost();

        // --- XỬ LÝ THÔNG TIN KHÁCH HÀNG (QUAN TRỌNG) ---

        if (contract.getCustomer() != null) {
            // >>> TRƯỜNG HỢP A: Đã là Customer (Có tài khoản)
            this.customerId = contract.getCustomer().getId();
            this.customerName = contract.getCustomer().getCustomerName();
            this.customerAddress = contract.getCustomer().getAddress(); // Địa chỉ mặc định

            // Lấy SĐT từ Account (nếu có)
            if (contract.getCustomer().getAccount() != null) {
                this.customerPhone = contract.getCustomer().getAccount().getPhone();
            }
        } else {
            // >>> TRƯỜNG HỢP B: GUEST (Khách vãng lai - Chưa có Customer ID)
            this.customerId = null;

            // 1. Lấy Tên từ Notes (Format: "Tên Guest | Ghi chú")
            String rawNotes = contract.getNotes();
            if (rawNotes != null && rawNotes.contains("|")) {
                String[] parts = rawNotes.split("\\|");
                // Lấy phần đầu tiên làm tên, xóa khoảng trắng thừa
                this.customerName = parts[0].trim();
            } else {
                // Nếu không đúng format, hiển thị thông báo hoặc lấy nguyên note
                this.customerName = (rawNotes != null && !rawNotes.isEmpty()) ? rawNotes : "Khách vãng lai";
            }

            // 2. Lấy SĐT từ cột riêng của Guest (contact_phone)
            this.customerPhone = contract.getContactPhone();
        }

        // --- XỬ LÝ ĐỊA CHỈ LẮP ĐẶT (ƯU TIÊN BẢNG ADDRESSES) ---
        // Nếu Contract có liên kết với bảng Addresses (dù là Guest hay User) -> Lấy địa chỉ này
        if (contract.getAddress() != null) {
            String street = (contract.getAddress().getStreet() != null) ? contract.getAddress().getStreet() : "";
            String ward = "";
            String district = "";

            if (contract.getAddress().getWard() != null) {
                ward = contract.getAddress().getWard().getWardName();
                district = contract.getAddress().getWard().getDistrict();
            }
            // Ghép chuỗi: Số 10, Phường A, Quận B
            this.customerAddress = String.format("%s, %s, %s", street, ward, district)
                    .replace("null", "") // Xử lý rác nếu có
                    .replaceAll("^, |^, |, $", ""); // Xóa dấu phẩy thừa ở đầu/cuối
        }

        // --- LẤY THÔNG TIN BỔ SUNG ---

        // Lấy Price Type Name (từ contract_usage_details)
        if (contract.getContractUsageDetails() != null && !contract.getContractUsageDetails().isEmpty()) {
            ContractUsageDetail usage = contract.getContractUsageDetails().get(0);
            if (usage.getPriceType() != null) {
                this.priceTypeName = usage.getPriceType().getTypeName();
            }
        }

        // Lấy Route Name (từ reading_routes)
        if (contract.getReadingRoute() != null) {
            this.routeName = contract.getReadingRoute().getRouteName();
        }

        // Thông tin Staff
        if (contract.getTechnicalStaff() != null) {
            this.technicalStaffId = contract.getTechnicalStaff().getId();
            this.technicalStaffName = contract.getTechnicalStaff().getFullName();
        }
    }
}