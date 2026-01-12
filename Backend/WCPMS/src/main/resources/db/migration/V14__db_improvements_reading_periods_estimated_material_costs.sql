/*
 * - Thêm bảng thời kỳ (reading_periods) để quản lý kỳ ghi chỉ số theo tháng (MM/YYYY)
 * - Thêm old_reading_date vào meter_readings (reading_date được hiểu là ngày đọc mới)
 * - Thêm bảng tham chiếu chi phí vật liệu dự tính (để nhập chi phí dự tính khi khảo sát)
 * - Thêm customer_id vào water_meters để dễ tra cứu/hiển thị khi ghi chỉ số
 */

-- 1) Bảng thời kỳ - chỉ gồm id + period đúng theo yêu cầu
CREATE TABLE IF NOT EXISTS `reading_periods` (
                                                 `id` INT NOT NULL AUTO_INCREMENT,
                                                 `period` VARCHAR(7) NOT NULL COMMENT 'Định dạng MM/YYYY, ví dụ 10/2025',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_reading_periods_period` (`period`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Bảng thời kỳ ghi chỉ số đồng hồ theo tháng';

-- Khởi tạo dữ liệu thời kỳ từ meter_readings hiện có + thêm thời kỳ của tháng hiện tại
-- (chạy lại không lỗi nhờ INSERT IGNORE)
INSERT IGNORE INTO `reading_periods` (`period`)
SELECT DISTINCT DATE_FORMAT(`reading_date`, '%m/%Y') AS `period` FROM `meter_readings`
UNION
SELECT DATE_FORMAT(CURDATE(), '%m/%Y');


-- 2) Meter readings: thêm old_reading_date (ngày đọc cũ / kỳ trước)
ALTER TABLE `meter_readings`
    ADD COLUMN `old_reading_date` DATE NULL
    COMMENT 'Ngày đọc cũ (kỳ trước). reading_date được hiểu là ngày đọc mới'
    AFTER `meter_installation_id`;

-- (Tùy chọn) Tự động cập nhật old_reading_date = reading_date gần nhất trước đó
-- theo cùng meter_installation_id
UPDATE meter_readings mr
    JOIN (
    SELECT
    id,
    LAG(reading_date) OVER (PARTITION BY meter_installation_id ORDER BY reading_date) as prev_date
    FROM meter_readings
    ) temp ON mr.id = temp.id
    SET mr.old_reading_date = temp.prev_date;


-- 3) Bảng tham chiếu chi phí vật liệu dự tính
CREATE TABLE IF NOT EXISTS `estimated_material_costs` (
                                                          `id` INT NOT NULL AUTO_INCREMENT,
                                                          `material_code` VARCHAR(50) NOT NULL,
    `material_name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(20) DEFAULT NULL,
    `unit_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Đơn giá vật liệu dự tính (VND)',
    `description` TEXT,
    `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_estimated_material_code` (`material_code`),
    KEY `idx_estimated_material_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Bảng chi phí dự tính (vật liệu) để tham khảo khi khảo sát';

-- Khởi tạo một số chi phí vật tư từ Excel mẫu
INSERT IGNORE INTO `estimated_material_costs` (`material_code`, `material_name`, `unit`, `unit_cost`, `description`, `status`) VALUES
('BANG_TAN',              'Băng tan',                                 'cuộn',  4000.00,   'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('GIOANG_BICH_DN80',      'Gioăng bích DN 80',                         'cái',  10000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('GIOANG_BICH_DN100',     'Gioăng bích DN 100',                        'cái',  15000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('BU_LONG_M16X70',        'Bu lông M16 x70',                           'bộ',  13500.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('HOP_BAO_QUAN_DH',       'Hộp bảo quản đồng hồ (nhựa)',               'cái',  95000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('KEP_CHI_CHONG_TT',      'Kẹp chì chống tổn thất',                    'viên', 15000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),

('ONG_HDPE_D20',          'Ống nhựa HDPE D20mm (L300m)',               'm',     7182.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('ONG_HDPE_D25',          'Ống nhựa HDPE D25mm (L300m)',               'm',     9273.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('ONG_HDPE_D32',          'Ống nhựa HDPE D32mm (L200m)',               'm',    13091.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('ONG_HDPE_D40',          'Ống nhựa HDPE D40mm (L150m)',               'm',    15273.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('ONG_HDPE_D50',          'Ống nhựa HDPE D50mm (L100m)',               'm',    21636.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),

('VAN_1_CHIEU_D25',       'Van 1 chiều d=25mm',                        'cái',  99000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('VAN_1_CHIEU_D32',       'Van 1 chiều d=32mm',                        'cái', 156000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('VAN_1_CHIEU_D40',       'Van 1 chiều d=40mm',                        'cái', 220000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE'),
('VAN_1_CHIEU_D50',       'Van 1 chiều d=50mm',                        'cái', 255000.00,  'Tham khảo từ bảng Tổng hợp VT (Excel mẫu)', 'ACTIVE');


-- 4) Water meters: thêm customer_id để tra cứu/hiển thị khi ghi chỉ số
ALTER TABLE `water_meters`
    ADD COLUMN `customer_id` INT NULL
    COMMENT 'Khách hàng đang gắn với đồng hồ (nếu có) - phục vụ hiển thị khi ghi chỉ số'
    AFTER `id`;

-- Tự động gán customer_id theo lần lắp đặt gần nhất (nếu có)
UPDATE `water_meters` wm
SET wm.`customer_id` = (
    SELECT mi.`customer_id`
    FROM `meter_installations` mi
    WHERE mi.`meter_id` = wm.`id`
    ORDER BY mi.`installation_date` DESC, mi.`id` DESC
    LIMIT 1
    )
WHERE wm.`customer_id` IS NULL;

-- Thêm index + khóa ngoại (sau khi đã backfill)
ALTER TABLE `water_meters`
    ADD KEY `idx_water_meters_customer_id` (`customer_id`),
  ADD CONSTRAINT `fk_water_meters_customer_id`
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
    ON DELETE SET NULL;