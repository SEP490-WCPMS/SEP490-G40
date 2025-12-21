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
import lombok.RequiredArgsConstructor; // <-- Đổi sang @RequiredArgsConstructor

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
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

        // --- THÊM BƯỚC KIỂM TRA STATUS ---
        // Chỉ cho phép Thu ngân đọc số của đồng hồ đang được lắp đặt
        if (meter.getMeterStatus() != WaterMeter.MeterStatus.INSTALLED) {
            throw new IllegalStateException("Đồng hồ này không ở trạng thái 'Đã Lắp Đặt' (INSTALLED). Trạng thái hiện tại: " + meter.getMeterStatus());
        }
        // --- HẾT PHẦN THÊM ---

        // 2. --- SỬA LỖI Ở ĐÂY ---
        // Lấy thông tin Lắp đặt (Bảng 11) MỚI NHẤT từ Đồng hồ
        MeterInstallation installation = meterInstallationRepository.findTopByWaterMeterOrderByInstallationDateDesc(meter)
                .orElseThrow(() -> new ResourceNotFoundException("MeterInstallation (bản ghi lắp đặt mới nhất) not found for meter: " + meterCode));
        // --- HẾT PHẦN SỬA ---

        // 3. LẤY HỢP ĐỒNG DỊCH VỤ (BẢNG 9) TỪ LẮP ĐẶT
        WaterServiceContract serviceContract = installation.getWaterServiceContract();
        if (serviceContract == null) {
            throw new ResourceNotFoundException("No active WaterServiceContract associated with this meter installation.");
        }

        // 4. Lấy Khách hàng (Bảng 7) từ HĐ Dịch vụ
        // === SỬA LOGIC LẤY KHÁCH HÀNG TẠI ĐÂY ===
        Customer customer = null;

        // Ưu tiên 1: Lấy từ Hợp đồng Gốc (Bảng 8) - Nơi lưu chủ sở hữu pháp lý hiện tại
        if (serviceContract.getSourceContract() != null && serviceContract.getSourceContract().getCustomer() != null) {
            customer = serviceContract.getSourceContract().getCustomer();
        }
        // Ưu tiên 2 (Fallback): Lấy từ Hợp đồng Dịch vụ (Bảng 9)
        else if (serviceContract.getCustomer() != null) {
            customer = serviceContract.getCustomer();
        }

        if (customer == null) {
            throw new ResourceNotFoundException("No Customer associated with this service contract.");
        }
        // =========================================

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
        // --- SỬA LOGIC LẤY ĐỊA CHỈ TẠI ĐÂY ---
        String displayAddress = customer.getAddress(); // Mặc định: Địa chỉ KH

        // Ưu tiên 1: Lấy từ Hợp đồng Dịch vụ (Bảng 9) -> Bảng Address
        if (serviceContract.getAddress() != null) {
            if (serviceContract.getAddress().getAddress() != null) {
                displayAddress = serviceContract.getAddress().getAddress();
            } else {
                displayAddress = serviceContract.getAddress().getStreet(); // Hoặc ghép chuỗi
            }
        }
        // Ưu tiên 2: Lấy từ Hợp đồng Lắp đặt (Bảng 8) -> Bảng Address (Dự phòng)
        else if (serviceContract.getSourceContract() != null
                && serviceContract.getSourceContract().getAddress() != null) {

            if (serviceContract.getSourceContract().getAddress().getAddress() != null) {
                displayAddress = serviceContract.getSourceContract().getAddress().getAddress();
            } else {
                displayAddress = serviceContract.getSourceContract().getAddress().getStreet();
            }
        }

        dto.setCustomerAddress(displayAddress);
        // ------------------------------------
        dto.setMeterInstallationId(installation.getId());
        dto.setPreviousReading(previousReading);
        // --- BỔ SUNG CÁC TRƯỜNG MỚI ĐỂ HIỂN THỊ CHI TIẾT ---
        dto.setCustomerCode(customer.getCustomerCode()); // Mã KH

        if (customer.getAccount() != null) {
            dto.setCustomerPhone(customer.getAccount().getPhone()); // SĐT
        }

        if (serviceContract.getPriceType() != null) {
            dto.setPriceType(serviceContract.getPriceType().getTypeName()); // Loại giá (Sinh hoạt, KD...)
        }

        dto.setMeterSerial(meter.getSerialNumber()); // Số seri đồng hồ

        if (serviceContract.getReadingRoute() != null) {
            dto.setRouteName(serviceContract.getReadingRoute().getRouteName()); // Tên tuyến
        }
        // ---------------------------------------------------

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


        // --- VALIDATION LOGIC MỚI (THÊM VÀO ĐÂY) ---
        // Kiểm tra logic: Chỉ số mới KHÔNG ĐƯỢC nhỏ hơn chỉ số cũ
        // Lưu ý: Dùng compareTo của BigDecimal. (a.compareTo(b) < 0 nghĩa là a < b)
        if (dto.getCurrentReading().compareTo(dto.getPreviousReading()) < 0) {
            throw new IllegalArgumentException("Lỗi Logic: Chỉ số mới (" + dto.getCurrentReading() +
                    ") không được nhỏ hơn chỉ số cũ (" + dto.getPreviousReading() + ").");
        }
        // ------------------------------------------


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

        // ========== 4. TỰ ĐỘNG ASSIGN CHO ACCOUNTING STAFF ÍT VIỆC NHẤT ==========
        Account assignedAccountant = accountRepository
            .findLeastBusyAccountingStaffForWaterBillingTask()
            .orElseThrow(() -> new IllegalStateException(
                "Không tìm thấy nhân viên kế toán active để phân công lập hóa đơn tiền nước."
            ));

        newReading.setAccountingStaff(assignedAccountant);

        // Log để debug và tracking
        System.out.println("✅ [AUTO-ASSIGN] Meter Reading ID: " + newReading.getId() +
                         " được phân công cho Accounting Staff: " +
                         assignedAccountant.getFullName() + " (ID: " + assignedAccountant.getId() + ")");
        // ======================================================================

        // 5. Lưu vào DB (với accounting_staff_id đã được set)
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