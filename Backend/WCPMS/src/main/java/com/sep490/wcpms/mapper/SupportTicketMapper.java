package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.SupportTicketDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerFeedback;
import org.springframework.stereotype.Component;

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

        // --- THÊM 2 DÒNG BỊ THIẾU ---
        dto.setResponse(entity.getResponse()); // Lấy nội dung phản hồi
        dto.setResolvedDate(entity.getResolvedDate()); // Lấy ngày giải quyết
        // --- HẾT PHẦN THÊM ---

        return dto;
    }
}
