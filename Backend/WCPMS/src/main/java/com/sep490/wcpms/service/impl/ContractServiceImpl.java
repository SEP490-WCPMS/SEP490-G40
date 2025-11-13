package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.dto.ContractRequestDetailDTO;
import com.sep490.wcpms.dto.WaterMeterResponseDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.entity.Contract.ContractStatus; // Import Enum
import com.sep490.wcpms.event.ContractRequestCreatedEvent;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher; // thêm import publisher
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays; // Import Arrays
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContractServiceImpl implements ContractService {

    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WaterPriceTypeRepository waterPriceTypeRepository;
    @Autowired
    private ContractUsageDetailRepository contractUsageDetailRepository;
    @Autowired
    private MeterInstallationRepository meterInstallationRepository;
    @Autowired
    private ApplicationEventPublisher eventPublisher; // publisher domain event

    @Override
    @Transactional
    public void createContractRequest(ContractRequestDTO requestDTO) {
        Customer customer = customerRepository.findByAccount_Id(requestDTO.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng với account ID: " + requestDTO.getAccountId()));

        WaterPriceType priceType = waterPriceTypeRepository.findById(requestDTO.getPriceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại giá nước với ID: " + requestDTO.getPriceTypeId()));

        Contract newContract = new Contract();
        newContract.setCustomer(customer);
        newContract.setApplicationDate(LocalDate.now());

        // 1. Đặt trạng thái là DRAFT (IN HOA) theo Entity
        newContract.setContractStatus(ContractStatus.DRAFT);

        newContract.setStartDate(LocalDate.now()); // Ngày bắt đầu tạm thời
        newContract.setContractNumber("REQ-" + customer.getId() + "-" + System.currentTimeMillis());
        newContract.setNotes(requestDTO.getNotes());

        Contract savedContract = contractRepository.save(newContract);

        ContractUsageDetail usageDetail = new ContractUsageDetail();
        usageDetail.setContract(savedContract);
        usageDetail.setPriceType(priceType);
        usageDetail.setOccupants(requestDTO.getOccupants());
        usageDetail.setUsagePercentage(new BigDecimal("100.00"));
        contractUsageDetailRepository.save(usageDetail);

        // === PUBLISH DOMAIN EVENT (sau khi tạo thành công) ===
        eventPublisher.publishEvent(new ContractRequestCreatedEvent(
                savedContract.getId(),
                customer.getId(),
                customer.getCustomerName(),
                savedContract.getContractNumber(),
                java.time.LocalDateTime.now()
        ));
    }

    @Override
    public List<ContractRequestStatusDTO> getContractRequestsByAccountId(Integer accountId) {

        // 2. Định nghĩa các trạng thái cần lọc (IN HOA)
        List<ContractStatus> statusesToFetch = Arrays.asList(
                ContractStatus.DRAFT,
                ContractStatus.PENDING,
                ContractStatus.PENDING_SURVEY_REVIEW
        );

        // 3. Gọi hàm repository mới để lọc
        List<Contract> contracts = contractRepository.findByCustomer_Account_IdAndContractStatusInOrderByIdDesc(accountId, statusesToFetch);

        return contracts.stream()
                .map(ContractRequestStatusDTO::new) // DTO này sẽ lấy `status.name()` (là chuỗi "DRAFT")
                .collect(Collectors.toList());
    }

    @Override
    public ContractRequestDetailDTO getContractRequestDetail(Integer contractId, Integer accountId) {
        // Tìm hợp đồng theo ID
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        // Xác minh rằng hợp đồng này thuộc về khách hàng của account được chỉ định
        if (contract.getCustomer() == null ||
            contract.getCustomer().getAccount() == null ||
            !contract.getCustomer().getAccount().getId().equals(accountId)) {
            throw new ResourceNotFoundException("Bạn không có quyền truy cập vào hợp đồng này.");
        }

        // Tìm ContractUsageDetail của hợp đồng này
        ContractUsageDetail usageDetail = contractUsageDetailRepository.findByContract_Id(contractId)
                .orElse(null); // Nếu không có, truyền null

        // Trả về DTO với chi tiết đầy đủ
        return new ContractRequestDetailDTO(contract, usageDetail);
    }

    @Override
    @Transactional
    public WaterMeterResponseDTO getWaterMeterResponse(Integer contractId) {
        // Tìm hợp đồng trước
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        WaterMeterResponseDTO dto = new WaterMeterResponseDTO();
        meterInstallationRepository.findTopByContractOrderByInstallationDateDesc(contract)
                .ifPresent(mi -> {
                    // 1) Ảnh lắp đặt mới nhất
                    dto.setInstallationImageBase64(mi.getInstallationImageBase64());

                    // 2) Mã đồng hồ có trạng thái INSTALLED
                    WaterMeter wm = mi.getWaterMeter();
                    if (wm != null) {
                        // Nếu dùng enum cho meterStatus:
                        try {
                            if (wm.getMeterStatus() == WaterMeter.MeterStatus.INSTALLED) {
                                dto.setInstalledMeterCode(wm.getMeterCode());
                            }
                        } catch (Exception ignore) {
                            // fallback nếu meterStatus là String thay vì Enum
                            if (String.valueOf(wm.getMeterStatus()).equalsIgnoreCase("INSTALLED")) {
                                dto.setInstalledMeterCode(wm.getMeterCode());
                            }
                        }
                    }
                });

        return dto;
    }
}