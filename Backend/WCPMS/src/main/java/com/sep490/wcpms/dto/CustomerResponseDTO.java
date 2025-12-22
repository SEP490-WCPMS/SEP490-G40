package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponseDTO {
    // --- Các trường định danh ---
    private Integer id;           // ID của Customer
    private Integer accountId;    // ID của Account
    private String customerCode;

    // --- Thông tin cá nhân ---
    private String customerName;
    private String identityNumber;
    private String email;
    private String phone;

    // --- Địa chỉ ---
    private String address;
    private String street;
    private String district;
    private String province;

    // --- Thông tin kỹ thuật (Lấy từ CustomerDTO) ---
    private String connectionType;
    private String connectionStatus;
    private String meterCode;
    private String meterStatus;
    // --- Trạng thái tài khoản ---
    private Integer accountStatus; // 1: Active, 0: Inactive

    // --- HÀM MAP DỮ LIỆU TỪ ENTITY (Logic cốt lõi) ---
    public static CustomerResponseDTO fromEntity(Customer customer) {
        if (customer == null) return null;

        CustomerResponseDTO.CustomerResponseDTOBuilder builder = CustomerResponseDTO.builder()
                .id(customer.getId())
                .customerCode(customer.getCustomerCode())
                .customerName(customer.getCustomerName())
                .identityNumber(customer.getIdentityNumber())
                .address(customer.getAddress())
                .street(customer.getStreet())
                .district(customer.getDistrict())
                .province(customer.getProvince());

        // Map Enum sang String an toàn
        if (customer.getConnectionType() != null)
            builder.connectionType(customer.getConnectionType().name());

        if (customer.getConnectionStatus() != null)
            builder.connectionStatus(customer.getConnectionStatus().name());

        if (customer.getMeterStatus() != null)
            builder.meterStatus(customer.getMeterStatus().name());

        // Map thông tin từ Account
        Account acc = customer.getAccount();
        if (acc != null) {
            builder.accountId(acc.getId());
            builder.email(acc.getEmail());
            builder.accountStatus(acc.getStatus());

            // Logic ưu tiên SĐT: Lấy contact của Customer -> Lấy phone của Account
            String finalPhone = (customer.getContactPersonPhone() != null && !customer.getContactPersonPhone().isEmpty())
                    ? customer.getContactPersonPhone()
                    : acc.getPhone();
            builder.phone(finalPhone);
        } else {
            // Nếu chưa có account, lấy sđt tạm từ customer
            builder.phone(customer.getContactPersonPhone());
            builder.accountStatus(1); // Mặc định active hoặc xử lý tùy logic
        }

        return builder.build();
    }
}