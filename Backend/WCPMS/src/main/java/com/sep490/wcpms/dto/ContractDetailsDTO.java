package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.ContractUsageDetail;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class ContractDetailsDTO {
    private Integer id;
    private String contractNumber;
    private Contract.ContractStatus contractStatus;
    private LocalDate applicationDate;

    // Thông tin hiển thị
    private Integer customerId;
    private String customerName;
    private String customerAddress;
    private String customerPhone;

    // Thông tin kỹ thuật
    private LocalDate surveyDate;
    private String technicalDesign;
    private BigDecimal estimatedCost;
    private String priceTypeName;
    private String routeName;
    private Integer technicalStaffId;
    private String technicalStaffName;

    public ContractDetailsDTO(Contract contract) {
        this.id = contract.getId();
        this.contractNumber = contract.getContractNumber();
        this.contractStatus = contract.getContractStatus();
        this.applicationDate = (contract.getCreatedAt() != null) ? contract.getCreatedAt().toLocalDate() : null;
        this.surveyDate = contract.getSurveyDate();
        this.technicalDesign = contract.getTechnicalDesign();
        this.estimatedCost = contract.getEstimatedCost();

        // --- 1. XỬ LÝ KHÁCH HÀNG ---
        if (contract.getCustomer() != null) {
            // >>> TRƯỜNG HỢP A: USER ĐÃ ĐĂNG KÝ
            this.customerId = contract.getCustomer().getId();
            this.customerName = contract.getCustomer().getCustomerName();
            this.customerAddress = contract.getCustomer().getAddress();
            if (contract.getCustomer().getAccount() != null) {
                this.customerPhone = contract.getCustomer().getAccount().getPhone();
            }
        } else {
            // >>> TRƯỜNG HỢP B: GUEST (Vãng lai)
            this.customerId = null;

            // Xử lý Tên từ Notes: "KHÁCH: Đỗ Ngọc Đức | ..."
            String rawNotes = contract.getNotes();

            if (rawNotes != null && !rawNotes.isEmpty()) {
                // Nếu có dấu gạch đứng "|"
                if (rawNotes.contains("|")) {
                    String[] parts = rawNotes.split("\\|");
                    String namePart = parts[0].trim(); // Lấy phần đầu: "KHÁCH: Đỗ Ngọc Đức"

                    // Xóa chữ "KHÁCH:" nếu có để lấy tên sạch
                    this.customerName = namePart.replace("KHÁCH:", "").trim();
                } else {
                    // Nếu không có dấu |, lấy toàn bộ note làm tên tạm
                    this.customerName = rawNotes;
                }
            } else {
                // Nếu note bị NULL (như dòng số 5 trong ảnh DB của bạn)
                this.customerName = "Khách vãng lai (Chưa nhập tên)";
            }

            // Lấy SĐT Guest
            this.customerPhone = contract.getContactPhone();
        }

        // --- 2. XỬ LÝ ĐỊA CHỈ (Ưu tiên lấy từ bảng Addresses linked với Contract) ---
        // (Áp dụng cho cả Guest và User nếu đơn này có địa chỉ lắp đặt riêng)
        if (contract.getAddress() != null) {
            String street = (contract.getAddress().getStreet() != null) ? contract.getAddress().getStreet() : "";
            String ward = "";
            String district = "";

            if (contract.getAddress().getWard() != null) {
                ward = contract.getAddress().getWard().getWardName();
                district = contract.getAddress().getWard().getDistrict();
            }

            // Format: "Số nhà, Phường, Quận"
            this.customerAddress = String.format("%s, %s, %s", street, ward, district)
                    .replace("null", "")
                    .replaceAll("^, |^, |, $", "");
        } else if (this.customerAddress == null) {
            // Fallback nếu không có gì cả
            this.customerAddress = "Chưa cập nhật địa chỉ";
        }

        // --- 3. CÁC THÔNG TIN KHÁC ---
        if (contract.getContractUsageDetails() != null && !contract.getContractUsageDetails().isEmpty()) {
            ContractUsageDetail usage = contract.getContractUsageDetails().get(0);
            if (usage.getPriceType() != null) {
                this.priceTypeName = usage.getPriceType().getTypeName();
            }
        }
        if (contract.getReadingRoute() != null) {
            this.routeName = contract.getReadingRoute().getRouteName();
        }
        if (contract.getTechnicalStaff() != null) {
            this.technicalStaffId = contract.getTechnicalStaff().getId();
            this.technicalStaffName = contract.getTechnicalStaff().getFullName();
        }
    }
}