package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Customer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    private Integer id;
    private Integer accountId;
    private String customerCode;
    private String customerName;
    private String identityNumber;
    private String address;
    private String street;
    private String district;
    private String province;
    private String connectionType;
    private String connectionStatus;
    private String meterStatus;
    private String phone;

    // Chuyển đổi từ Entity sang DTO
    public static CustomerDTO fromEntity(Customer customer) {
        if (customer == null) return null;

        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setCustomerCode(customer.getCustomerCode());
        dto.setCustomerName(customer.getCustomerName());
        dto.setIdentityNumber(customer.getIdentityNumber());
        dto.setAddress(customer.getAddress());
        dto.setStreet(customer.getStreet());
        dto.setDistrict(customer.getDistrict());
        dto.setProvince(customer.getProvince());

        if (customer.getAccount() != null) {
            dto.setAccountId(customer.getAccount().getId());
            dto.setPhone(customer.getAccount().getPhone());
        }

        if (customer.getConnectionType() != null) {
            dto.setConnectionType(customer.getConnectionType().name());
        }

        if (customer.getConnectionStatus() != null) {
            dto.setConnectionStatus(customer.getConnectionStatus().name());
        }

        if (customer.getMeterStatus() != null) {
            dto.setMeterStatus(customer.getMeterStatus().name());
        }

        return dto;
    }
}
