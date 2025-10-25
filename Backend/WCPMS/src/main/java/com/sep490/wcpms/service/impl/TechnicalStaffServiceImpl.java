package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.WaterMeterRepository;
import com.sep490.wcpms.service.TechnicalStaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.dto.InstallationCompleteRequestDTO; // <-- Import DTO mới
import com.sep490.wcpms.repository.MeterInstallationRepository; // <-- Import Repo mới

import java.time.LocalDate;
import java.util.List;

@Service
public class TechnicalStaffServiceImpl implements TechnicalStaffService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private AccountRepository accountRepository; // Dùng để lấy đối tượng Account

    @Autowired
    private ContractMapper contractMapper;

    @Autowired
    private MeterInstallationRepository meterInstallationRepository;

    @Autowired
    private WaterMeterRepository waterMeterRepository;

    /**
     * Hàm helper lấy Account object từ ID
     */
    private Account getStaffAccountById(Integer staffId) {
        return accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Account (Staff) not found with id: " + staffId));
    }

    /**
     * Hàm helper lấy Contract và xác thực quyền truy cập của staff
     */
    private Contract getContractAndVerifyAccess(Integer contractId, Integer staffId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        if (contract.getTechnicalStaff() == null || !contract.getTechnicalStaff().getId().equals(staffId)) {
            throw new AccessDeniedException("You are not assigned to this contract.");
        }
        return contract;
    }

    // === LUỒNG 1: SURVEY ===

    @Override
    public List<ContractDetailsDTO> getAssignedSurveyContracts(Integer staffId) {
        Account staff = getStaffAccountById(staffId);
        List<Contract> contracts = contractRepository.findByTechnicalStaffAndContractStatus(
                staff, Contract.ContractStatus.PENDING
        );
        return contractMapper.toDtoList(contracts);
    }

    @Override
    @Transactional
    public ContractDetailsDTO submitSurveyReport(Integer contractId, SurveyReportRequestDTO reportDTO, Integer staffId) {
        Contract contract = getContractAndVerifyAccess(contractId, staffId);

        // Chỉ cho phép nộp khi ở trạng thái DRAFT
        if (contract.getContractStatus() != Contract.ContractStatus.PENDING) {
            throw new IllegalStateException("Cannot submit report. Contract is not in DRAFT status.");
        }

        // Cập nhật thông tin từ DTO
        contractMapper.updateContractFromSurveyDTO(contract, reportDTO);

        // Chuyển trạng thái sang PENDING_SURVEY_REVIEW
        contract.setContractStatus(Contract.ContractStatus.PENDING_SURVEY_REVIEW);

        Contract savedContract = contractRepository.save(contract);
        return contractMapper.toDto(savedContract);
    }

    // === LUỒNG 2: INSTALLATION ===

    @Override
    public List<ContractDetailsDTO> getAssignedInstallationContracts(Integer staffId) {
        Account staff = getStaffAccountById(staffId);
        // Lấy hợp đồng ở trạng thái APPROVED (đã ký, chờ lắp đặt)
        List<Contract> contracts = contractRepository.findByTechnicalStaffAndContractStatus(
                staff, Contract.ContractStatus.SIGNED
        );
        return contractMapper.toDtoList(contracts);
    }

    @Override
    @Transactional
    public ContractDetailsDTO markInstallationAsCompleted(Integer contractId,
                                                          InstallationCompleteRequestDTO installDTO,
                                                          Integer staffId) {

        Contract contract = getContractAndVerifyAccess(contractId, staffId);
        Account staff = contract.getTechnicalStaff();
        Customer customer = contract.getCustomer();

        if (contract.getContractStatus() != Contract.ContractStatus.SIGNED) {
            throw new IllegalStateException("Cannot complete installation. Contract is not in APPROVED status.");
        }

        // 1. Lấy đối tượng WaterMeter từ MÃ CODE (String)
        // === SỬA LỖI TẠI ĐÂY ===
        WaterMeter meter = waterMeterRepository.findByMeterCode(installDTO.getMeterCode())
                .orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found with code: " + installDTO.getMeterCode()));

        // 2. TẠO BIÊN BẢN LẮP ĐẶT (MeterInstallation)
        MeterInstallation installation = new MeterInstallation();
        installation.setContract(contract);
        installation.setCustomer(customer);
        installation.setTechnicalStaff(staff);
        installation.setInstallationDate(LocalDate.now());
        installation.setWaterMeter(meter);
        installation.setInitialReading(installDTO.getInitialReading());
        installation.setNotes(installDTO.getNotes());

        // --- THÊM DÒNG NÀY ---
        installation.setInstallationImageBase64(installDTO.getInstallationImageBase64());

        meterInstallationRepository.save(installation);

        // (Tùy chọn: Cập nhật trạng thái đồng hồ)
        meter.setMeterStatus(WaterMeter.MeterStatus.INSTALLED);
        waterMeterRepository.save(meter);

        // 3. CẬP NHẬT HỢP ĐỒNG
        contract.setInstallationDate(LocalDate.now());
        contract.setContractStatus(Contract.ContractStatus.ACTIVE);
        contractRepository.save(contract);

        return contractMapper.toDto(contract);
    }

    // === CHUNG ===

    @Override
    public ContractDetailsDTO getContractDetails(Integer contractId, Integer staffId) {
        Contract contract = getContractAndVerifyAccess(contractId, staffId);
        return contractMapper.toDto(contract);
    }
}