package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.ContractUsageDetail;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractRequestDetailDTO {

    // Thông tin chung
    private Integer contractId;
    private String contractNumber;
    private LocalDate applicationDate;
    private String status;
    private String notes;

    // Thông tin hiển thị (Dùng chung cho Guest và Customer)
    private String customerName;      // Tên khách (Lấy từ Customer hoặc Note)
    private String customerCode;      // Mã KH (Guest = null)
    private String address;           // Địa chỉ lắp đặt (Lấy từ Address entity)
    private String contactPersonName;
    private String contactPersonPhone;// SĐT liên hệ (Lấy từ Contract.contactPhone)
    private String identityNumber;

    // Các trường Guest riêng biệt (nếu FE cần phân biệt)
    private String guestName;
    private String guestPhone;
    private String guestAddress;

    // Thông tin kỹ thuật
    private Integer priceTypeId;
    private String priceTypeName;
    private String usagePurpose;
    private Integer occupants;
    private BigDecimal usagePercentage;
    private BigDecimal estimatedMonthlyConsumption;
    private Integer routeId;
    private String routeCode;
    private String routeName;

    public ContractRequestDetailDTO(Contract contract, ContractUsageDetail usageDetail) {
        this.contractId = contract.getId();
        this.contractNumber = contract.getContractNumber();
        this.applicationDate = contract.getApplicationDate();
        this.status = contract.getContractStatus().name();
        this.notes = contract.getNotes();

        // 1. LẤY SỐ ĐIỆN THOẠI
        // Ưu tiên SĐT trong Contract (cho Guest), nếu không có thì lấy của Customer
        if (contract.getContactPhone() != null) {
            this.contactPersonPhone = contract.getContactPhone();
            this.guestPhone = contract.getContactPhone();
        } else if (contract.getCustomer() != null) {
            this.contactPersonPhone = contract.getCustomer().getContactPersonPhone();
        }

        // 2. LẤY ĐỊA CHỈ
        // Ưu tiên lấy từ bảng Address được gắn vào Contract (Guest dùng cái này)
        if (contract.getAddress() != null) {
            this.address = contract.getAddress().getAddress(); // Hoặc getStreet()
            this.guestAddress = this.address;
        }
        // Fallback: Lấy địa chỉ trong hồ sơ Customer
        else if (contract.getCustomer() != null) {
            this.address = contract.getCustomer().getAddress();
        }

        // 3. LẤY TÊN KHÁCH HÀNG
        if (contract.getCustomer() != null) {
            this.customerName = contract.getCustomer().getCustomerName();
            this.customerCode = contract.getCustomer().getCustomerCode();
            this.identityNumber = contract.getCustomer().getIdentityNumber();
            this.contactPersonName = contract.getCustomer().getContactPersonName();

            try { this.routeId = contract.getCustomer().getRouteId(); } catch (Exception ignore) {}
        } else {
            // Guest: Tên nằm trong Notes ("KHÁCH: Nguyễn Văn A...")
            this.customerName = "Khách vãng lai (Xem Ghi chú)";
            this.guestName = "Khách vãng lai";
        }

        // 4. MAP USAGE DETAIL
        if (usageDetail != null && usageDetail.getPriceType() != null) {
            this.priceTypeId = usageDetail.getPriceType().getId();
            this.priceTypeName = usageDetail.getPriceType().getTypeName();
            this.usagePurpose = usageDetail.getPriceType().getUsagePurpose();
            this.occupants = usageDetail.getOccupants();
            this.usagePercentage = usageDetail.getUsagePercentage();
            this.estimatedMonthlyConsumption = usageDetail.getEstimatedMonthlyConsumption();
        }

        // 5. MAP ROUTE
        if (contract.getReadingRoute() != null) {
            this.routeId = contract.getReadingRoute().getId();
            this.routeCode = contract.getReadingRoute().getRouteCode();
            this.routeName = contract.getReadingRoute().getRouteName();
        }
    }
}