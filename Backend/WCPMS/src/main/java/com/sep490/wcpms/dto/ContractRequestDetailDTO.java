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

    // Thông tin hợp đồng
    private Integer contractId;
    private String contractNumber;
    private LocalDate applicationDate;
    private String status;
    private String notes;

    // Thông tin khách hàng
    private String customerName;
    private String customerCode;
    private String address;
    private String contactPersonName;
    private String contactPersonPhone;
    private String identityNumber;

    // Thông tin loại giá nước
    private Integer priceTypeId;
    private String priceTypeName;
    private String usagePurpose;

    // Thông tin sử dụng nước
    private Integer occupants;
    private BigDecimal usagePercentage;
    private BigDecimal estimatedMonthlyConsumption;

    // Constructor để chuyển đổi từ Contract + ContractUsageDetail
    public ContractRequestDetailDTO(Contract contract, ContractUsageDetail usageDetail) {
        // Thông tin hợp đồng
        this.contractId = contract.getId();
        this.contractNumber = contract.getContractNumber();
        this.applicationDate = contract.getApplicationDate();
        this.status = contract.getContractStatus().name();
        this.notes = contract.getNotes();

        // Thông tin khách hàng
        if (contract.getCustomer() != null) {
            this.customerName = contract.getCustomer().getCustomerName();
            this.customerCode = contract.getCustomer().getCustomerCode();
            this.address = contract.getCustomer().getAddress();
            this.contactPersonName = contract.getCustomer().getContactPersonName();
            this.contactPersonPhone = contract.getCustomer().getContactPersonPhone();
            this.identityNumber = contract.getCustomer().getIdentityNumber();
        }

        // Thông tin loại giá nước và sử dụng
        if (usageDetail != null && usageDetail.getPriceType() != null) {
            this.priceTypeId = usageDetail.getPriceType().getId();
            this.priceTypeName = usageDetail.getPriceType().getTypeName();
            this.usagePurpose = usageDetail.getPriceType().getUsagePurpose();
            this.occupants = usageDetail.getOccupants();
            this.usagePercentage = usageDetail.getUsagePercentage();
            this.estimatedMonthlyConsumption = usageDetail.getEstimatedMonthlyConsumption();
        }
    }
}

