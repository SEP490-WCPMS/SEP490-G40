package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.MeterReadingSaveDTO;
import com.sep490.wcpms.dto.ReadingConfirmationDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.MeterInstallationRepository;
import com.sep490.wcpms.repository.MeterReadingRepository;
import com.sep490.wcpms.service.MeterReadingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.entity.AiScanLog; // <-- IMPORT MỚI
import com.sep490.wcpms.repository.AiScanLogRepository; // <-- IMPORT MỚI
import com.sep490.wcpms.repository.WaterMeterRepository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class MeterReadingServiceImpl implements MeterReadingService {

    @Autowired private ContractRepository contractRepository;
    @Autowired private MeterInstallationRepository meterInstallationRepository;
    @Autowired private MeterReadingRepository meterReadingRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private AiScanLogRepository aiScanLogRepository;
    @Autowired private WaterMeterRepository waterMeterRepository;

    @Override
    @Transactional(readOnly = true) // <-- THÊM DÒNG NÀY (readOnly = true để tối ưu)
    public ReadingConfirmationDTO getConfirmationDataByMeterCode(String meterCode) {
        // 1. Lấy Đồng hồ (Bảng 10)
        WaterMeter meter = waterMeterRepository.findByMeterCode(meterCode)
                .orElseThrow(() -> new ResourceNotFoundException("WaterMeter not found: " + meterCode));

        // 2. Lấy thông tin Lắp đặt (Bảng 11)
        MeterInstallation installation = meterInstallationRepository.findByWaterMeter(meter)
                .orElseThrow(() -> new ResourceNotFoundException("MeterInstallation not found for meter: " + meterCode));

        // 3. LẤY HỢP ĐỒNG DỊCH VỤ (BẢNG 9) TỪ LẮP ĐẶT
        WaterServiceContract serviceContract = installation.getWaterServiceContract();
        if (serviceContract == null) {
            throw new ResourceNotFoundException("No active WaterServiceContract associated with this meter installation.");
        }

        // 4. Lấy Khách hàng (Bảng 7) từ HĐ Dịch vụ
        Customer customer = serviceContract.getCustomer();
        if(customer == null) {
            throw new ResourceNotFoundException("No Customer associated with this service contract.");
        }

        // 5. Tìm chỉ số CŨ (Giữ nguyên logic)
        BigDecimal previousReading;
        Optional<MeterReading> lastReading = meterReadingRepository
                .findTopByMeterInstallationOrderByReadingDateDesc(installation);

        if (lastReading.isPresent()) {
            previousReading = lastReading.get().getCurrentReading();
        } else {
            previousReading = installation.getInitialReading();
        }

        // 6. Tạo DTO trả về
        ReadingConfirmationDTO dto = new ReadingConfirmationDTO();
        dto.setContractNumber(serviceContract.getContractNumber()); // <-- LẤY SỐ HĐ TỪ BẢNG 9
        dto.setCustomerName(customer.getCustomerName());
        dto.setCustomerAddress(customer.getAddress());
        dto.setMeterInstallationId(installation.getId());
        dto.setPreviousReading(previousReading);

        return dto;
    }

    @Override
    @Transactional
    public void saveNewReading(MeterReadingSaveDTO dto, Integer readerId) {
        // 1. Lấy các đối tượng liên quan
        Account reader = accountRepository.findById(readerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reader (Account) not found: " + readerId));

        MeterInstallation installation = meterInstallationRepository.findById(dto.getMeterInstallationId())
                .orElseThrow(() -> new ResourceNotFoundException("MeterInstallation not found: " + dto.getMeterInstallationId()));

        // --- BƯỚC 1: LƯU NGHIỆP VỤ CHÍNH (Bảng 12 MeterReadings) ---
        // 2. Tạo bản ghi MeterReading mới (Bảng 12)
        MeterReading newReading = new MeterReading();
        newReading.setMeterInstallation(installation);
        newReading.setReader(reader);
        newReading.setReadingDate(LocalDate.now());

        newReading.setPreviousReading(dto.getPreviousReading());
        newReading.setCurrentReading(dto.getCurrentReading());

        // 3. Tính toán
        BigDecimal consumption = dto.getCurrentReading().subtract(dto.getPreviousReading());
        newReading.setConsumption(consumption);

        newReading.setReadingStatus(MeterReading.ReadingStatus.COMPLETED); // Trạng thái "đã hoàn thành"
        newReading.setNotes(dto.getNotes());

        // 4. Lưu vào DB
        meterReadingRepository.save(newReading);

        // --- BƯỚC 2: LƯU LOG  (Bảng Mới AiScanLogs) ---
        AiScanLog log = new AiScanLog();
        log.setReader(reader);
        log.setMeterInstallation(installation);
        log.setScanImageBase64(dto.getScanImageBase64());

        // Dữ liệu AI
        log.setAiDetectedReading(dto.getAiDetectedReading());
        log.setAiDetectedMeterId(dto.getAiDetectedMeterId());

        // Dữ liệu người dùng sửa
        log.setUserCorrectedReading(dto.getCurrentReading());
        log.setUserCorrectedMeterIdText(dto.getUserCorrectedMeterIdText());

        aiScanLogRepository.save(log);

        // TODO: (Nâng cao) Sau khi lưu, có thể kích hoạt 1 trigger/event để P. Kế toán biết
    }
}