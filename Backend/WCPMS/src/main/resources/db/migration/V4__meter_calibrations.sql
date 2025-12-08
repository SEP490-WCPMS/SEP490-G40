-- Thêm cột để lưu ID kế toán được phân công xử lý khoản phí này
ALTER TABLE meter_calibrations
    ADD COLUMN assigned_accountant_id INT NULL COMMENT 'Kế toán được giao nhiệm vụ lập hóa đơn',
ADD CONSTRAINT fk_cal_accountant
    FOREIGN KEY (assigned_accountant_id) REFERENCES accounts(id);