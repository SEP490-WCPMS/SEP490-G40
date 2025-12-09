package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;
import org.springframework.stereotype.Component;

/**
 * Mapper để chuyển đổi Entity Invoice (Bảng 17) sang InvoiceDTO.
 */
@Component
public class InvoiceMapper {

    public InvoiceDTO toDto(Invoice entity) {
        if (entity == null) {
            return null;
        }

        InvoiceDTO dto = new InvoiceDTO();

        // 1. Thông tin Hóa đơn (Bảng 17)
        dto.setId(entity.getId());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setFromDate(entity.getFromDate());
        dto.setToDate(entity.getToDate());
        dto.setTotalConsumption(entity.getTotalConsumption());
        dto.setSubtotalAmount(entity.getSubtotalAmount());
        dto.setVatAmount(entity.getVatAmount());
        dto.setEnvironmentFeeAmount(entity.getEnvironmentFeeAmount());
        // dto.setOtherFees(entity.getOtherFees()); // (Bỏ comment nếu bạn dùng Cách 2)
        dto.setLatePaymentFee(entity.getLatePaymentFee());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setPaymentStatus(entity.getPaymentStatus());
        dto.setInvoiceDate(entity.getInvoiceDate());
        dto.setDueDate(entity.getDueDate());
        dto.setPaidDate(entity.getPaidDate());

        // 2. Thông tin Khách hàng (Từ Bảng 7)
        Customer customer = entity.getCustomer();
        if (customer != null) {
            dto.setCustomerId(customer.getId());
            dto.setCustomerName(customer.getCustomerName());
            dto.setCustomerCode(entity.getCustomer().getCustomerCode());
            // --- SỬA TẠI ĐÂY: LOGIC ƯU TIÊN ĐỊA CHỈ HỢP ĐỒNG ---
            String displayAddress = customer.getAddress(); // Mặc định: Lấy địa chỉ chung của KH

            // Kiểm tra nếu Hợp đồng có gắn Địa chỉ lắp đặt riêng (Bảng Address)
            if (entity.getContract() != null && entity.getContract().getAddress() != null) {
                com.sep490.wcpms.entity.Address installAddr = entity.getContract().getAddress();

                // Nếu có chuỗi địa chỉ đầy đủ
                if (installAddr.getAddress() != null && !installAddr.getAddress().isEmpty()) {
                    displayAddress = installAddr.getAddress();
                }
                // Nếu không, tự ghép từ Tên đường + Phường/Xã
                else {
                    String street = installAddr.getStreet() != null ? installAddr.getStreet() : "";
                    String ward = (installAddr.getWard() != null) ? installAddr.getWard().getWardName() : "";
                    String district = (installAddr.getWard() != null) ? installAddr.getWard().getDistrict() : "";

                    // Ghép chuỗi (ví dụ: "Số 10, Tân Dân, Việt Trì")
                    displayAddress = street;
                    if (!ward.isEmpty()) displayAddress += ", " + ward;
                    if (!district.isEmpty()) displayAddress += ", " + district;
                }
            }

            // Gán địa chỉ cuối cùng vào DTO
            dto.setCustomerAddress(displayAddress);
            // ----------------------------------------------------
            // --- THÊM LOGIC LẤY SĐT/EMAIL ---
            // (Giả định Customer entity đã liên kết với Account)
            if (customer.getAccount() != null) {
                dto.setCustomerPhone(customer.getAccount().getPhone());
                dto.setCustomerEmail(customer.getAccount().getEmail());
            }
            // --- HẾT PHẦN THÊM ---
        }

        // 3. Thông tin Hợp đồng (Từ Bảng 8)
        Contract contract = entity.getContract();
        if (contract != null) {
            dto.setContractId(contract.getId());
        }

        // 4. Thông tin Đọc số (Từ Bảng 15)
        MeterReading reading = entity.getMeterReading();
        if (reading != null) {
            dto.setMeterReadingId(reading.getId());

            // --- BỔ SUNG ĐOẠN NÀY ĐỂ HIỆN CHỈ SỐ ---
            dto.setOldIndex(reading.getPreviousReading());  // Lấy chỉ số cũ
            dto.setNewIndex(reading.getCurrentReading());   // Lấy chỉ số mới
            dto.setConsumption(reading.getConsumption());   // Lấy số khối tiêu thụ

            // Lấy kỳ ghi số (Ví dụ: Tháng/Năm)
            if (reading.getReadingDate() != null) {
                String period = reading.getReadingDate().getMonthValue() + "/" + reading.getReadingDate().getYear();
                dto.setBillingPeriod(period);
            }
            // ---------------------------------------

            // --- THÊM ĐOẠN NÀY ĐỂ LẤY MÃ ĐỒNG HỒ ---
            if (reading.getMeterInstallation() != null
                    && reading.getMeterInstallation().getWaterMeter() != null) {

                dto.setMeterCode(reading.getMeterInstallation().getWaterMeter().getMeterCode());
            }
            // ---------------------------------------
        } else {
            dto.setMeterReadingId(null); // (Cho Hóa đơn Dịch vụ)
        }

        // 5. Thông tin Kế toán (Từ Bảng 2)
        Account staff = entity.getAccountingStaff();
        if (staff != null) {
            dto.setAccountingStaffName(staff.getFullName());
        }

        return dto;
    }

    // (Bạn có thể thêm hàm toEntity(InvoiceDTO dto) nếu cần)
}