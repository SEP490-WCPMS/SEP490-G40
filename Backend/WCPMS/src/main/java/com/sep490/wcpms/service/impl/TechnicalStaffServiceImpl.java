package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.*; // Import hết DTO
import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.SurveyReportRequestDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractMapper;
import com.sep490.wcpms.mapper.SupportTicketMapper; // <-- THÊM
import com.sep490.wcpms.repository.*; // Import tất cả Repo
import com.sep490.wcpms.security.services.UserDetailsImpl; // THAY TÊN ĐÚNG
import com.sep490.wcpms.service.TechnicalStaffService; // <-- SỬA TÊN INTERFACE
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.WaterMeterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.dto.InstallationCompleteRequestDTO;
import com.sep490.wcpms.repository.MeterInstallationRepository;
// === THÊM CÁC IMPORT NÀY ===
import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.repository.WaterServiceContractRepository;
import com.sep490.wcpms.entity.ContractUsageDetail;

import com.sep490.wcpms.dto.MeterInfoDTO;
import com.sep490.wcpms.dto.MeterReplacementRequestDTO;
import com.sep490.wcpms.entity.MeterCalibration;
import com.sep490.wcpms.repository.MeterCalibrationRepository;
import com.sep490.wcpms.repository.MeterReadingRepository;
import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.sep490.wcpms.dto.OnSiteCalibrationDTO;

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
    @Autowired
    private MeterReadingRepository meterReadingRepository;
    @Autowired
    private MeterCalibrationRepository meterCalibrationRepository;
    @Autowired
    private CustomerFeedbackRepository customerFeedbackRepository;
    @Autowired
    private SupportTicketMapper supportTicketMapper;

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

    // --- HÀM MỚI 1: LẤY THÔNG TIN ĐỒNG HỒ CŨ ---
    @Override
    @Transactional(readOnly = true)
    public MeterInfoDTO getMeterInfoByCode(String meterCode, Integer staffId) {
        // 1. Tìm đồng hồ CŨ
        WaterMeter oldMeter = waterMeterRepository.findByMeterCode(meterCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đồng hồ với mã: " + meterCode));

        // 2. Tìm bản ghi lắp đặt MỚI NHẤT của đồng hồ đó
        MeterInstallation oldInstallation = meterInstallationRepository.findTopByWaterMeterOrderByInstallationDateDesc(oldMeter)
                .orElseThrow(() -> new ResourceNotFoundException("Đồng hồ này chưa được ghi nhận lắp đặt: " + meterCode));

        // 3. Lấy HĐ Dịch vụ và Khách hàng
        WaterServiceContract serviceContract = oldInstallation.getWaterServiceContract();
        if (serviceContract == null) {
            throw new ResourceNotFoundException("Không tìm thấy HĐ Dịch Vụ cho việc lắp đặt này.");
        }
        Customer customer = serviceContract.getCustomer();

        // 4. Tìm chỉ số đọc CUỐI CÙNG
        BigDecimal lastReading;
        Optional<MeterReading> lastReadingRecord = meterReadingRepository
                .findTopByMeterInstallationOrderByReadingDateDesc(oldInstallation);

        if (lastReadingRecord.isPresent()) {
            lastReading = lastReadingRecord.get().getCurrentReading(); // Lấy chỉ số MỚI của lần đọc trước
        } else {
            lastReading = oldInstallation.getInitialReading(); // Lấy chỉ số GỐC
        }

        // 5. Trả về DTO
        MeterInfoDTO dto = new MeterInfoDTO();
        dto.setCustomerName(customer.getCustomerName());
        dto.setCustomerAddress(customer.getAddress());
        dto.setContractNumber(serviceContract.getContractNumber()); // Số HĐ Dịch vụ
        dto.setMeterInstallationId(oldInstallation.getId()); // ID Lắp đặt CŨ
        dto.setLastReading(lastReading); // Chỉ số CŨ

        return dto;
    }

    // --- HÀM MỚI 2: XỬ LÝ THAY THẾ ĐỒNG HỒ ---
    @Override
    @Transactional
    public void processMeterReplacement(MeterReplacementRequestDTO dto, Integer staffId) {
        Account staff = getStaffAccountById(staffId);

        // 1. Lấy Đồng hồ CŨ
        WaterMeter oldMeter = waterMeterRepository.findByMeterCode(dto.getOldMeterCode())
                .orElseThrow(() -> new ResourceNotFoundException("Đồng hồ CŨ mã " + dto.getOldMeterCode() + " không tìm thấy."));

        // 2. Lấy Bản ghi Lắp đặt CŨ
        MeterInstallation oldInstallation = meterInstallationRepository.findTopByWaterMeterOrderByInstallationDateDesc(oldMeter)
                .orElseThrow(() -> new ResourceNotFoundException("Bản ghi lắp đặt cho đồng hồ CŨ không tìm thấy."));

        // 3. Lấy HĐ Dịch vụ và Khách hàng (từ bản ghi CŨ)
        WaterServiceContract serviceContract = oldInstallation.getWaterServiceContract();
        Customer customer = oldInstallation.getCustomer();

        // 4. CHỐT SỔ ĐỒNG HỒ CŨ (Tạo bản ghi MeterReading cuối cùng)
        MeterReading finalReading = new MeterReading();
        finalReading.setMeterInstallation(oldInstallation);
        finalReading.setReader(staff); // NV Kỹ thuật là người chốt sổ
        finalReading.setReadingDate(LocalDate.now());

        // Lấy chỉ số trước đó
        BigDecimal previousReading;
        Optional<MeterReading> lastReadingRecord = meterReadingRepository
                .findTopByMeterInstallationOrderByReadingDateDesc(oldInstallation);
        previousReading = lastReadingRecord.map(MeterReading::getCurrentReading).orElse(oldInstallation.getInitialReading());

        finalReading.setPreviousReading(previousReading);
        finalReading.setCurrentReading(dto.getOldMeterFinalReading()); // Chỉ số cuối cùng

        if (dto.getOldMeterFinalReading().compareTo(previousReading) < 0) {
            throw new IllegalArgumentException("Chỉ số cuối của đồng hồ cũ không thể nhỏ hơn chỉ số đọc trước đó.");
        }
        finalReading.setConsumption(dto.getOldMeterFinalReading().subtract(previousReading));
        finalReading.setReadingStatus(MeterReading.ReadingStatus.VERIFIED); // Đã xác nhận
        finalReading.setNotes("Chốt sổ do thay thế đồng hồ. Lý do: " + dto.getReplacementReason());
        meterReadingRepository.save(finalReading);

        // 5. Lấy Đồng hồ MỚI
        WaterMeter newMeter = waterMeterRepository.findByMeterCode(dto.getNewMeterCode())
                .orElseThrow(() -> new ResourceNotFoundException("Đồng hồ MỚI mã " + dto.getNewMeterCode() + " không tìm thấy."));

        if (newMeter.getMeterStatus() != WaterMeter.MeterStatus.IN_STOCK) {
            throw new IllegalStateException("Đồng hồ MỚI không ở trạng thái 'Trong Kho'.");
        }

        // 6. TẠO BẢN GHI LẮP ĐẶT MỚI (Bảng 13)
        MeterInstallation newInstallation = new MeterInstallation();
        newInstallation.setContract(oldInstallation.getContract()); // Giữ HĐ Lắp đặt (Bảng 8)
        newInstallation.setWaterServiceContract(serviceContract); // Giữ HĐ Dịch vụ (Bảng 9)
        newInstallation.setCustomer(customer);
        newInstallation.setWaterMeter(newMeter); // Gán đồng hồ MỚI
        newInstallation.setTechnicalStaff(staff);
        newInstallation.setInstallationDate(LocalDate.now());
        newInstallation.setInitialReading(dto.getNewMeterInitialReading()); // Chỉ số ĐẦU MỚI
        newInstallation.setInstallationImageBase64(dto.getInstallationImageBase64());
        newInstallation.setNotes(dto.getNotes());
        meterInstallationRepository.save(newInstallation);

        // 7. XỬ LÝ LÝ DO & CẬP NHẬT TRẠNG THÁI ĐỒNG HỒ (Bảng 10)
        if ("CALIBRATION".equalsIgnoreCase(dto.getReplacementReason())) {
            oldMeter.setMeterStatus(WaterMeter.MeterStatus.UNDER_MAINTENANCE); // Gửi đi kiểm định

            // Tạo bản ghi Kiểm định (Bảng 14)
            MeterCalibration calibration = new MeterCalibration();
            calibration.setMeter(oldMeter);
            calibration.setCalibrationDate(LocalDate.now());
            calibration.setCalibrationStatus(MeterCalibration.CalibrationStatus.PENDING); // Đang chờ kết quả
            calibration.setCalibrationCost(dto.getCalibrationCost()); // Gán chi phí
            calibration.setNotes("Tháo dỡ để kiểm định định kỳ 5 năm.");
            meterCalibrationRepository.save(calibration);

        } else { // Mặc định là 'BROKEN'
            oldMeter.setMeterStatus(WaterMeter.MeterStatus.BROKEN);
        }

        newMeter.setMeterStatus(WaterMeter.MeterStatus.INSTALLED);

        waterMeterRepository.save(oldMeter);

        waterMeterRepository.save(newMeter);
    }

    // --- HÀM MỚI CHO KIỂM ĐỊNH TẠI CHỖ ---
    @Override
    @Transactional
    public void processOnSiteCalibration(OnSiteCalibrationDTO dto, Integer staffId) {
        // 1. Lấy Đồng hồ (Bảng 10)
        WaterMeter meter = waterMeterRepository.findByMeterCode(dto.getMeterCode())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đồng hồ với mã: " + dto.getMeterCode()));

        // 2. TẠO BẢN GHI KIỂM ĐỊNH MỚI (Bảng 14)
        MeterCalibration calibration = new MeterCalibration();
        calibration.setMeter(meter);
        calibration.setCalibrationDate(dto.getCalibrationDate());
        calibration.setCalibrationStatus(dto.getCalibrationStatus());
        calibration.setNextCalibrationDate(dto.getNextCalibrationDate()); // Ngày hẹn 5 năm sau
        calibration.setCalibrationCertificateNumber(dto.getCalibrationCertificateNumber());
        calibration.setCalibrationCost(dto.getCalibrationCost()); // Chi phí
        calibration.setNotes(dto.getNotes() + " (Kiểm định tại chỗ)");

        meterCalibrationRepository.save(calibration);

        // 3. Cập nhật Đồng hồ (Bảng 10)
        meter.setNextMaintenanceDate(dto.getNextCalibrationDate()); // Cập nhật ngày kiểm định tiếp theo

        // Nếu kiểm định hỏng (FAILED), đánh dấu đồng hồ là BROKEN
        if (dto.getCalibrationStatus() == MeterCalibration.CalibrationStatus.FAILED) {
            meter.setMeterStatus(WaterMeter.MeterStatus.BROKEN);
            // (Lúc này, hệ thống có thể tạo 1 ticket mới yêu cầu "Thay thế" đồng hồ này)
        } else {
            meter.setMeterStatus(WaterMeter.MeterStatus.INSTALLED); // Vẫn đang hoạt động tốt
        }

        waterMeterRepository.save(meter);
    }

    // === BƯỚC 3 (LUỒNG TICKET): LẤY VIỆC ĐƯỢC GIAO ===

    @Override
    @Transactional(readOnly = true)
    public Page<SupportTicketDTO> getMyMaintenanceRequests(Integer staffId, Pageable pageable) {
        Account staff = getStaffAccountById(staffId);

        // Tìm các ticket được gán cho staff này VÀ đang "IN_PROGRESS"
        Page<CustomerFeedback> tickets = customerFeedbackRepository.findByAssignedToAndStatus(
                staff,
                CustomerFeedback.Status.IN_PROGRESS,
                pageable
        );
        return tickets.map(supportTicketMapper::toDto);
    }
}