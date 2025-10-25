package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Contract.ContractStatus; // Import Enum
import com.sep490.wcpms.entity.ContractUsageDetail;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.WaterPriceType;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.ContractUsageDetailRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.repository.WaterPriceTypeRepository;
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
    private WaterPriceTypeRepository waterPriceTypeRepository;
    @Autowired
    private ContractUsageDetailRepository contractUsageDetailRepository;

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
}