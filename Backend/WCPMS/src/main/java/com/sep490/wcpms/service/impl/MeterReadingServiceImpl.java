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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class MeterReadingServiceImpl implements MeterReadingService {

    @Autowired private ContractRepository contractRepository;
    @Autowired private MeterInstallationRepository meterInstallationRepository;
    @Autowired private MeterReadingRepository meterReadingRepository;
    @Autowired private AccountRepository accountRepository;

    @Override
    public ReadingConfirmationDTO getConfirmationData(Integer contractId) {
        // 1. Lấy Hợp đồng (dùng logic contractId = meterId của bạn)
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        // 2. Lấy thông tin Lắp đặt (Bảng 11) từ Hợp đồng
        MeterInstallation installation = meterInstallationRepository.findByContract(contract)
                .orElseThrow(() -> new ResourceNotFoundException("MeterInstallation not found for contract id: " + contractId));

        // 3. Tìm chỉ số CŨ
        BigDecimal previousReading;

        // 3a. Tìm bản ghi đọc cuối cùng (Bảng 12)
        Optional<MeterReading> lastReading = meterReadingRepository
                .findTopByMeterInstallationOrderByReadingDateDesc(installation);

        if (lastReading.isPresent()) {
            // Nếu có, chỉ số cũ = chỉ số MỚI của lần đọc trước
            previousReading = lastReading.get().getCurrentReading();
        } else {
            // Nếu chưa đọc lần nào, chỉ số cũ = chỉ số GỐC (lúc lắp đặt)
            previousReading = installation.getInitialReading();
        }

        // 4. Tạo DTO trả về
        ReadingConfirmationDTO dto = new ReadingConfirmationDTO();
        dto.setContractNumber(contract.getContractNumber());
        dto.setCustomerName(contract.getCustomer().getCustomerName());
        dto.setCustomerAddress(contract.getCustomer().getAddress());
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

        // TODO: (Nâng cao) Sau khi lưu, có thể kích hoạt 1 trigger/event để P. Kế toán biết
    }
}