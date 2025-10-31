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
import com.sep490.wcpms.dto.InstallationCompleteRequestDTO;
import com.sep490.wcpms.repository.MeterInstallationRepository;
// === THÊM CÁC IMPORT NÀY ===
import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.repository.WaterServiceContractRepository;
import com.sep490.wcpms.entity.ContractUsageDetail;

import java.time.LocalDate;
import java.util.List;

@Service
// Bạn có thể đổi sang @RequiredArgsConstructor nếu muốn dùng 'final' thay vì @Autowired
public class TechnicalStaffServiceImpl implements TechnicalStaffService {

    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ContractMapper contractMapper;
    @Autowired
    private MeterInstallationRepository meterInstallationRepository;
    @Autowired
    private WaterMeterRepository waterMeterRepository;
    @Autowired
    private WaterServiceContractRepository waterServiceContractRepository; // Repo cho Bảng 9

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

        // --- SỬA LỖI MESSAGE ---
        // Kiểm tra đúng status PENDING (Chờ khảo sát)
        if (contract.getContractStatus() != Contract.ContractStatus.PENDING) {
            // Báo lỗi đúng status
            throw new IllegalStateException("Cannot submit report. Contract is not in PENDING status.");
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
        // Lấy hợp đồng ở trạng thái SIGNED (đã ký, chờ lắp đặt)
        List<Contract> contracts = contractRepository.findByTechnicalStaffAndContractStatus(
                staff, Contract.ContractStatus.SIGNED
        );
        return contractMapper.toDtoList(contracts);
    }

    @Override
    @Transactional // Đảm bảo tất cả các thao tác DB cùng thành công hoặc thất bại
    public ContractDetailsDTO markInstallationAsCompleted(Integer contractId,
                                                          InstallationCompleteRequestDTO installDTO,
                                                          Integer staffId) {

        // 1. Lấy dữ liệu gốc
        Contract contract = getContractAndVerifyAccess(contractId, staffId); // HĐ Lắp đặt (Bảng 8)
        Account staff = contract.getTechnicalStaff();
        Customer customer = contract.getCustomer();
        WaterMeter meter = waterMeterRepository.findByMeterCode(installDTO.getMeterCode())
                .orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found with code: " + installDTO.getMeterCode()));

        // 2. Kiểm tra trạng thái
        if (contract.getContractStatus() != Contract.ContractStatus.SIGNED) {
            throw new IllegalStateException("Cannot complete installation. Contract is not in SIGNED status.");
        }

        // 3. Cập nhật HĐ Lắp đặt (Bảng 8)
        contract.setInstallationDate(LocalDate.now());
        contract.setContractStatus(Contract.ContractStatus.ACTIVE);
        // (Sẽ save ở bước 5)

        // 4. TẠO MỚI HỢP ĐỒNG DỊCH VỤ (Bảng 9)
        WaterServiceContract serviceContract = new WaterServiceContract();
        serviceContract.setContractNumber("DV-" + contract.getContractNumber()); // Tạo số HĐ Dịch vụ (ví dụ)
        serviceContract.setCustomer(customer);

        // Lấy price_type_id từ Bảng 10 (contract_usage_details)
        if (contract.getContractUsageDetails() != null && !contract.getContractUsageDetails().isEmpty()) {
            ContractUsageDetail usageDetail = contract.getContractUsageDetails().get(0);
            if (usageDetail.getPriceType() == null) { // Thêm kiểm tra null cho priceType
                throw new IllegalStateException("Contract Usage Detail is missing PriceType mapping.");
            }
            serviceContract.setPriceType(usageDetail.getPriceType()); // Gán đối tượng WaterPriceType
        } else {
            throw new IllegalStateException("Contract is missing Usage Details (Price Type).");
        }

        serviceContract.setServiceStartDate(LocalDate.now());
        serviceContract.setContractSignedDate(LocalDate.now()); // Giả định ngày ký là hôm nay
        serviceContract.setContractStatus(WaterServiceContract.WaterServiceContractStatus.ACTIVE);
        serviceContract.setSourceContract(contract); // Liên kết ngược về HĐ Lắp đặt (Bảng 8)
        serviceContract.setCreatedBy(staff); // Gán người tạo là NV Kỹ thuật

        // Lưu HĐ Dịch vụ (Bảng 9)
        WaterServiceContract savedServiceContract = waterServiceContractRepository.save(serviceContract);

        // 5. Cập nhật HĐ Lắp đặt (Bảng 8) để trỏ đến HĐ Dịch vụ mới
        contract.setPrimaryWaterContract(savedServiceContract);
        contractRepository.save(contract); // Lưu lại thay đổi của Bảng 8

        // 6. TẠO BIÊN BẢN LẮP ĐẶT (Bảng 11)
        MeterInstallation installation = new MeterInstallation();
        installation.setContract(contract); // Liên kết HĐ Lắp đặt (Bảng 8)

        // --- THÊM DÒNG QUAN TRỌNG BỊ THIẾU ---
        installation.setWaterServiceContract(savedServiceContract); // Liên kết HĐ Dịch vụ (Bảng 9)
        // --- HẾT PHẦN SỬA ---

        installation.setCustomer(customer);
        installation.setTechnicalStaff(staff);
        installation.setInstallationDate(LocalDate.now());
        installation.setWaterMeter(meter);
        installation.setInitialReading(installDTO.getInitialReading());
        installation.setNotes(installDTO.getNotes());
        installation.setInstallationImageBase64(installDTO.getInstallationImageBase64());

        meterInstallationRepository.save(installation); // Lưu Bảng 11

        // 7. Cập nhật trạng thái Đồng hồ (Bảng 10)
        meter.setMeterStatus(WaterMeter.MeterStatus.INSTALLED);
        waterMeterRepository.save(meter); // Lưu Bảng 10

        // --- XÓA KHỐI LẶP Ở ĐÂY ---
        // Khối code "3. CẬP NHẬT HỢP ĐỒNG" đã được thực hiện ở bước 3 và 5
        // --- HẾT PHẦN XÓA ---

        return contractMapper.toDto(contract);
    }

    // === CHUNG ===
    @Override
    public ContractDetailsDTO getContractDetails(Integer contractId, Integer staffId) {
        Contract contract = getContractAndVerifyAccess(contractId, staffId);
        return contractMapper.toDto(contract);
    }
}