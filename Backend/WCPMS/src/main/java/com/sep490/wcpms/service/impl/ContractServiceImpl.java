package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.ContractUsageDetail;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.ContractUsageDetailRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
import com.sep490.wcpms.service.ContractService; // Import interface
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service // Đánh dấu đây là một Service
public class ContractServiceImpl implements ContractService { // Triển khai interface

    @Override
    public List<ContractRequestStatusDTO> getContractRequestsByAccountId(Integer accountId) {
        // 1. Gọi phương thức mới từ repository
        List<Contract> contracts = contractRepository.findByCustomer_Account_IdOrderByIdDesc(accountId);

        // 2. Chuyển đổi danh sách Entity sang DTO
        return contracts.stream()
                .map(ContractRequestStatusDTO::new) // Dùng hàm constructor tiện ích trong DTO
                .collect(Collectors.toList());
    }

    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WaterPriceTypeRepository waterPriceTypeRepository;
    @Autowired
    private ContractUsageDetailRepository contractUsageDetailRepository;

    @Override // Ghi đè phương thức từ interface
    @Transactional
    public void createContractRequest(ContractRequestDTO requestDTO) {
        // 1. Tìm khách hàng từ accountId
        Customer customer = customerRepository.findByAccount_Id(requestDTO.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng với account ID: " + requestDTO.getAccountId()));

        // 2. Tìm loại giá nước
        WaterPriceType priceType = waterPriceTypeRepository.findById(requestDTO.getPriceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại giá nước với ID: " + requestDTO.getPriceTypeId()));

        // 3. Tạo Hợp đồng mới
        Contract newContract = new Contract();
        newContract.setCustomer(customer);
        newContract.setApplicationDate(LocalDate.now());

        // Giải pháp cho các trường NOT NULL
        newContract.setContractStatus(Contract.ContractStatus.PENDING);
        newContract.setStartDate(LocalDate.now());
        newContract.setContractNumber("REQ-" + customer.getId() + "-" + System.currentTimeMillis());

        newContract.setNotes(requestDTO.getNotes());

        // 4. Lưu hợp đồng để lấy ID
        Contract savedContract = contractRepository.save(newContract);

        // 5. Tạo chi tiết sử dụng hợp đồng
        ContractUsageDetail usageDetail = new ContractUsageDetail();
        usageDetail.setContract(savedContract);
        usageDetail.setPriceType(priceType);
        usageDetail.setOccupants(requestDTO.getOccupants());
        usageDetail.setUsagePercentage(new BigDecimal("100.00"));

        // 6. Lưu chi tiết sử dụng
        contractUsageDetailRepository.save(usageDetail);
    }
}