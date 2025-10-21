package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.MeterReadingSaveDTO;
import com.sep490.wcpms.dto.ReadingConfirmationDTO;

public interface MeterReadingService {

    /** Lấy thông tin xác nhận: Hợp đồng + Chỉ số cũ */
    ReadingConfirmationDTO getConfirmationData(Integer contractId);

    /** Lưu bản ghi chỉ số mới vào bảng meter_readings */
    void saveNewReading(MeterReadingSaveDTO dto, Integer readerId);
}