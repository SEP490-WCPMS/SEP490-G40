package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerFeedback;
import org.springframework.stereotype.Component;
import com.sep490.wcpms.dto.SupportTicketDetailDTO; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.*; // Import hết

@Component
public class SupportTicketMapper {

    /**
     * Chuyển đổi từ Entity CustomerFeedback sang DTO SupportTicketDTO.
     * @param entity Entity lấy từ Bảng 20.
     * @return DTO để hiển thị cho Front-end.
     */
    public SupportTicketDTO toDto(CustomerFeedback entity) {
        if (entity == null) {
            return null;
        }

        SupportTicketDTO dto = new SupportTicketDTO();
        dto.setId(entity.getId());
        dto.setFeedbackNumber(entity.getFeedbackNumber());
        dto.setDescription(entity.getDescription());
        dto.setFeedbackType(entity.getFeedbackType());
        dto.setStatus(entity.getStatus());
        dto.setSubmittedDate(entity.getSubmittedDate());

        // Lấy thông tin khách hàng (an toàn)
        Customer customer = entity.getCustomer();
        if (customer != null) {
            dto.setCustomerId(customer.getId());
            dto.setCustomerName(customer.getCustomerName());
            dto.setCustomerAddress(customer.getAddress());
        }

        // Lấy thông tin nhân viên được gán (an toàn)
        Account assignedTo = entity.getAssignedTo();
        if (assignedTo != null) {
            dto.setAssignedToId(assignedTo.getId());
            dto.setAssignedToName(assignedTo.getFullName());
        }

        // --- THÊM LOGIC LẤY ĐỒNG HỒ ---
        WaterMeter meter = entity.getWaterMeter();
        if (meter != null) {
            dto.setMeterCode(meter.getMeterCode()); // Gán mã đồng hồ vào DTO
        }
        // -----------------------------

        // --- THÊM 2 DÒNG BỊ THIẾU ---
        dto.setResponse(entity.getResponse()); // Lấy nội dung phản hồi
        dto.setResolvedDate(entity.getResolvedDate()); // Lấy ngày giải quyết
        // --- HẾT PHẦN THÊM ---

        return dto;
    }

    /**
     * --- HÀM MỚI ---
     * Chuyển đổi sang DTO Chi tiết (dùng cho trang Chi tiết Ticket).
     * Yêu cầu Entity CustomerFeedback đã được fetch đầy đủ (Customer, Account).
     * @param entity Entity CustomerFeedback (Bảng 20)
     * @param serviceContract HĐ Dịch vụ (Bảng 9) tìm được
     * @param installation Bản ghi Lắp đặt (Bảng 13) tìm được
     * @return SupportTicketDetailDTO
     */
    public SupportTicketDetailDTO toDetailDto(CustomerFeedback entity, WaterServiceContract serviceContract, MeterInstallation installation) {
        if (entity == null) {
            return null;
        }

        SupportTicketDetailDTO dto = new SupportTicketDetailDTO();

        // 1. Thông tin Ticket (Bảng 20)
        dto.setId(entity.getId());
        dto.setFeedbackNumber(entity.getFeedbackNumber());
        dto.setDescription(entity.getDescription());
        dto.setFeedbackType(entity.getFeedbackType());
        dto.setStatus(entity.getStatus());
        dto.setSubmittedDate(entity.getSubmittedDate());

        // 2. Thông tin Khách hàng (Bảng 7 và Bảng 2)
        Customer customer = entity.getCustomer();
        if (customer != null) {
            dto.setCustomerId(customer.getId());
            dto.setCustomerName(customer.getCustomerName());
            dto.setCustomerAddress(customer.getAddress());

            // Lấy SĐT, Email từ Account của Customer
            Account customerAccount = customer.getAccount();
            if (customerAccount != null) {
                dto.setCustomerPhone(customerAccount.getPhone());
                dto.setCustomerEmail(customerAccount.getEmail());
            }
        }

        // 3. Thông tin NV Kỹ thuật được gán (Bảng 2)
        Account assignedTo = entity.getAssignedTo();
        if (assignedTo != null) {
            dto.setAssignedToId(assignedTo.getId());
            dto.setAssignedToName(assignedTo.getFullName());
        }

        // 4. Thông tin HĐ Dịch vụ (Bảng 9)
        if (serviceContract != null) {
            dto.setServiceContractNumber(serviceContract.getContractNumber());
            if (serviceContract.getPriceType() != null) {
                dto.setPriceTypeName(serviceContract.getPriceType().getTypeName());
            }
        }

        // 5. Thông tin Đồng hồ (Bảng 13 -> Bảng 10)
        if (installation != null && installation.getWaterMeter() != null) {
            dto.setMeterCode(installation.getWaterMeter().getMeterCode());
            dto.setMeterSerialNumber(installation.getWaterMeter().getSerialNumber());
        }

        return dto;
    }
}
