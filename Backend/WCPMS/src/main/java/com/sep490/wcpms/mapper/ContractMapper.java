package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.entity.Address;
import com.sep490.wcpms.entity.Contract;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ContractMapper {

    // Chuyển Entity -> DTO
    public ContractDetailsDTO toDto(Contract contract) {
        if (contract == null) return null;

        ContractDetailsDTO dto = new ContractDetailsDTO();
        dto.setId(contract.getId());
        dto.setContractNumber(contract.getContractNumber());
        dto.setContractStatus(contract.getContractStatus());
        // Null check cho applicationDate
        dto.setApplicationDate(contract.getCreatedAt() != null ? contract.getCreatedAt().toLocalDate() : null);

        // ============================================================
        // === 1. XỬ LÝ THÔNG TIN KHÁCH HÀNG (User vs Guest) ===
        // ============================================================

        if (contract.getCustomer() != null) {
            // >>> TRƯỜNG HỢP A: Đã là Customer (Có tài khoản)
            dto.setCustomerId(contract.getCustomer().getId());
            dto.setCustomerName(contract.getCustomer().getCustomerName());

            // Lấy địa chỉ mặc định từ hồ sơ khách hàng
            dto.setCustomerAddress(contract.getCustomer().getAddress());

            // Lấy SĐT
            if (contract.getCustomer().getAccount() != null) {
                dto.setCustomerPhone(contract.getCustomer().getAccount().getPhone());
            }
        } else {
            // >>> TRƯỜNG HỢP B: GUEST (Khách vãng lai)
            dto.setCustomerId(null);

            // --- XỬ LÝ TÊN TỪ NOTES (Hack: "KHÁCH: Tên | Ghi chú") ---
            String rawNotes = contract.getNotes();
            if (rawNotes != null && !rawNotes.isEmpty()) {
                if (rawNotes.contains("|")) {
                    String[] parts = rawNotes.split("\\|");
                    String namePart = parts[0].trim();
                    // Loại bỏ chữ "KHÁCH:" nếu có để lấy tên sạch
                    dto.setCustomerName(namePart.replace("KHÁCH:", "").trim());
                } else {
                    dto.setCustomerName(rawNotes); // Fallback
                }
            } else {
                dto.setCustomerName("Khách vãng lai");
            }

            // --- LẤY SĐT GUEST ---
            dto.setCustomerPhone(contract.getContactPhone());
        }

        // ============================================================
        // === 2. XỬ LÝ ĐỊA CHỈ LẮP ĐẶT (Ưu tiên bảng Address) ===
        // ============================================================
        // Logic này áp dụng cho cả Guest và Customer nếu đơn này có địa chỉ riêng (address_id != null)
        if (contract.getAddress() != null) {
            Address addr = contract.getAddress();
            String displayAddress = "";

            if (addr.getAddress() != null && !addr.getAddress().isEmpty()) {
                // Nếu đã có chuỗi full
                displayAddress = addr.getAddress();
            } else {
                // Tự ghép chuỗi từ Street + Ward + District
                String street = addr.getStreet() != null ? addr.getStreet() : "";
                String wardName = (addr.getWard() != null) ? addr.getWard().getWardName() : "";
                String district = (addr.getWard() != null) ? addr.getWard().getDistrict() : "";

                // Format đẹp: "Số 10, Phường A, Quận B"
                displayAddress = String.format("%s, %s, %s", street, wardName, district)
                        .replace("null", "")
                        .replaceAll("^, |^, |, $", ""); // Xóa dấu phẩy thừa
            }

            // GHI ĐÈ địa chỉ lắp đặt vào DTO
            dto.setCustomerAddress(displayAddress);
        }

        // ============================================================

        // Xử lý Technical Staff
        if (contract.getTechnicalStaff() != null) {
            dto.setTechnicalStaffId(contract.getTechnicalStaff().getId());
            dto.setTechnicalStaffName(contract.getTechnicalStaff().getFullName());
        }

        // Thông tin khảo sát
        dto.setSurveyDate(contract.getSurveyDate());
        dto.setTechnicalDesign(contract.getTechnicalDesign());
        dto.setEstimatedCost(contract.getEstimatedCost());

        // Lấy Loại giá
        if (contract.getContractUsageDetails() != null && !contract.getContractUsageDetails().isEmpty()) {
            var usageDetail = contract.getContractUsageDetails().get(0);
            if (usageDetail != null && usageDetail.getPriceType() != null) {
                dto.setPriceTypeName(usageDetail.getPriceType().getTypeName());
            }
        }

        // Lấy Tuyến đọc
        if (contract.getReadingRoute() != null) {
            dto.setRouteName(contract.getReadingRoute().getRouteName());
        }

        return dto;
    }

    public List<ContractDetailsDTO> toDtoList(List<Contract> contracts) {
        return contracts.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void updateContractFromSurveyDTO(Contract contract, SurveyReportRequestDTO dto) {
        if (contract == null || dto == null) return;
        contract.setSurveyDate(dto.getSurveyDate());
        contract.setTechnicalDesign(dto.getTechnicalDesign());
        contract.setEstimatedCost(dto.getEstimatedCost());
    }
}