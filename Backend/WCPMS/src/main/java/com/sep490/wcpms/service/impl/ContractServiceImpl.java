package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.dto.ContractRequestDetailDTO;
import com.sep490.wcpms.dto.WaterMeterResponseDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.entity.Contract.ContractStatus; // Import Enum
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
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
    private AccountRepository accountRepository;
    @Autowired
    private WaterPriceTypeRepository waterPriceTypeRepository;
    @Autowired
    private ContractUsageDetailRepository contractUsageDetailRepository;
    @Autowired
    private MeterInstallationRepository meterInstallationRepository;
    @Autowired
    private ReadingRouteRepository readingRouteRepository; // Inject ReadingRouteRepository

    @Override
    @Transactional
    public void createContractRequest(ContractRequestDTO requestDTO) {
        // Tạo 1 bản ghi Customer mới cho mỗi yêu cầu đăng ký hợp đồng
        // Lấy Account để liên kết
        Account account = null;
        if (requestDTO.getAccountId() != null) {
            account = accountRepository.findById(requestDTO.getAccountId()).orElse(null);
        }

        Customer customer = new Customer();
        customer.setAccount(account);

        // Gán tên khách hàng trực tiếp từ Account (registered name). No personal fields from request.
        String customerName = account != null ? account.getFullName() : "Khách hàng";
        customer.setCustomerName(customerName);
        // Set address empty string to satisfy NOT NULL constraint in DB
        customer.setAddress("");
        // Do not set identityNumber or meterCode from request (removed)

        // Gán route_id từ request
        customer.setRouteId(requestDTO.getRouteId());

        // Sinh customerCode mới (ví dụ: KH001)
        String maxCode = customerRepository.findMaxCustomerCode().orElse(null);
        String newCode = "KH001";
        if (maxCode != null && maxCode.startsWith("KH")) {
            try {
                String numPart = maxCode.substring(2);
                int num = Integer.parseInt(numPart);
                newCode = String.format("KH%03d", num + 1);
            } catch (NumberFormatException ignored) {
            }
        }
        customer.setCustomerCode(newCode);

        // Log customer before saving for debugging
        // (do not log sensitive data in production)
        System.out.println("Saving Customer: name=" + customer.getCustomerName() + ", accountId=" + (customer.getAccount() != null ? customer.getAccount().getId() : null) + ", routeId=" + customer.getRouteId());
        customer = customerRepository.save(customer);

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
        ContractRequestDetailDTO dto = new ContractRequestDetailDTO(contract, usageDetail);
        // Populate reading route info if available
        try {
            Integer routeId = dto.getRouteId();
            if (routeId != null) {
                readingRouteRepository.findById(routeId).ifPresent(rr -> {
                    dto.setRouteCode(rr.getRouteCode());
                    dto.setRouteName(rr.getRouteName());
                });
            }
        } catch (Exception ignore) {
        }
        return dto;
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