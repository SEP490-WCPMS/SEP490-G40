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
        dto.setApplicationDate(contract.getApplicationDate());

        // Xử lý Customer (tránh NullPointerException)
        if (contract.getCustomer() != null) {
            dto.setCustomerId(contract.getCustomer().getId());
            dto.setCustomerName(contract.getCustomer().getCustomerName()); // Giả định field là getFullName()
            // --- [SỬA ĐỔI TẠI ĐÂY] LOGIC LẤY ĐỊA CHỈ THÔNG MINH ---
            String displayAddress = contract.getCustomer().getAddress(); // Mặc định lấy từ Customer

            // Ưu tiên: Lấy từ bảng Address được gắn vào Hợp đồng
            if (contract.getAddress() != null) {
                Address addr = contract.getAddress();
                if (addr.getAddress() != null && !addr.getAddress().isEmpty()) {
                    // Nếu đã có chuỗi full
                    displayAddress = addr.getAddress();
                } else {
                    // Nếu chưa có, tự ghép chuỗi từ Street + Ward
                    String street = addr.getStreet() != null ? addr.getStreet() : "";
                    String wardName = (addr.getWard() != null) ? addr.getWard().getWardName() : "";
                    String district = (addr.getWard() != null) ? addr.getWard().getDistrict() : "";

                    displayAddress = street;
                    if (!wardName.isEmpty()) displayAddress += ", " + wardName;
                    if (!district.isEmpty()) displayAddress += ", " + district;
                }
            }

            dto.setCustomerAddress(displayAddress);
            // -------------------------------------------------------
        }

        // Xử lý Technical Staff (tránh NullPointerException)
        if (contract.getTechnicalStaff() != null) {
            dto.setTechnicalStaffId(contract.getTechnicalStaff().getId());
            dto.setTechnicalStaffName(contract.getTechnicalStaff().getFullName()); // Giả định
        }

        // Thông tin khảo sát
        dto.setSurveyDate(contract.getSurveyDate());
        dto.setTechnicalDesign(contract.getTechnicalDesign());
        dto.setEstimatedCost(contract.getEstimatedCost());
        // --- LOGIC MỚI: LẤY LOẠI GIÁ VÀ TUYẾN ĐỌC ---

        // 1. Lấy Loại giá (Từ Bảng 10)
        if (contract.getContractUsageDetails() != null && !contract.getContractUsageDetails().isEmpty()) {
            // Lấy loại giá từ bản ghi đầu tiên
            var usageDetail = contract.getContractUsageDetails().get(0);
            if (usageDetail != null && usageDetail.getPriceType() != null) {
                dto.setPriceTypeName(usageDetail.getPriceType().getTypeName());
            }
        }

        // 2. Lấy Tuyến đọc (Từ Bảng 8 -> Bảng 4)
        if (contract.getReadingRoute() != null) {
            dto.setRouteName(contract.getReadingRoute().getRouteName());
        }

        // --- HẾT PHẦN THÊM ---

        return dto;
    }

    // Chuyển List<Entity> -> List<DTO>
    public List<ContractDetailsDTO> toDtoList(List<Contract> contracts) {
        return contracts.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Cập nhật Entity từ SurveyReport DTO
    public void updateContractFromSurveyDTO(Contract contract, SurveyReportRequestDTO dto) {
        if (contract == null || dto == null) return;

        contract.setSurveyDate(dto.getSurveyDate());
        contract.setTechnicalDesign(dto.getTechnicalDesign());
        contract.setEstimatedCost(dto.getEstimatedCost());
    }
}