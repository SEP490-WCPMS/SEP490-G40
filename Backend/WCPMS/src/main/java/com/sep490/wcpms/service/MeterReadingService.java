package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.MeterReadingSaveDTO;
import com.sep490.wcpms.dto.ReadingConfirmationDTO;

public interface MeterReadingService {

    /** SỬA LẠI HÀM NÀY: Input là meterCode (String) */
    ReadingConfirmationDTO getConfirmationDataByMeterCode(String meterCode);

    /** Lưu bản ghi chỉ số mới vào bảng meter_readings */
    void saveNewReading(MeterReadingSaveDTO dto, Integer readerId);
}