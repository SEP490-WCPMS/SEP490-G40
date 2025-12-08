-- V7: Add accounting_staff_id to meter_readings table
-- Purpose: Auto-assign Accounting Staff for water billing invoices
-- Author: Backend Team
-- Date: 2025-12-08

-- 1. Add accounting_staff_id column to meter_readings
ALTER TABLE meter_readings
    ADD COLUMN accounting_staff_id INT NULL COMMENT 'Nhân viên kế toán được phân công lập hóa đơn tiền nước'
    AFTER reader_id;

-- 2. Add Foreign Key constraint
ALTER TABLE meter_readings
    ADD CONSTRAINT fk_meter_readings_accounts_accounting_assigned
        FOREIGN KEY (accounting_staff_id)
        REFERENCES accounts(id)
        ON DELETE SET NULL;

-- 3. Create indexes for optimization
CREATE INDEX idx_meter_readings_accounting_staff
    ON meter_readings(accounting_staff_id);

CREATE INDEX idx_meter_readings_status_accounting
    ON meter_readings(reading_status, accounting_staff_id);

-- 4. Add comment to table
ALTER TABLE meter_readings
    COMMENT = 'Bảng lưu trữ các bản ghi đọc chỉ số đồng hồ nước - có auto-assign accounting staff';

