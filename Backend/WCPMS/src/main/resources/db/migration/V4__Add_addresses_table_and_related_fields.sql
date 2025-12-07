-- =====================================================
-- V4: Migration - Thêm bảng addresses và các trường liên quan
-- =====================================================

-- =====================================================
-- Bước 1: Thêm staff_code vào bảng accounts
-- =====================================================
ALTER TABLE accounts
ADD COLUMN staff_code VARCHAR(50) NULL UNIQUE COMMENT 'Mã nhân viên - chỉ có với role nhân viên'
AFTER customer_code;

CREATE INDEX idx_staff_code ON accounts(staff_code);

-- =====================================================
-- Bước 2: Tạo bảng addresses
-- Mục đích: 1 customer có thể có NHIỀU địa chỉ
-- CHỈ LƯU ĐỊA CHỈ, không lưu phone/email (có trong accounts/customers)
-- =====================================================
CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Liên kết với customer
    customer_id INT NOT NULL COMMENT 'ID khách hàng từ bảng customers',

    -- Địa chỉ CHI TIẾT (dùng ward_id như bảng customers)
    street VARCHAR(100) NOT NULL COMMENT 'Số nhà, tên đường',
    ward_id INT NOT NULL COMMENT 'ID phường/xã từ bảng wards',
    address VARCHAR(255) COMMENT 'Địa chỉ đầy đủ (có thể concat từ street + ward)',

    -- Metadata
    is_active TINYINT DEFAULT 1 COMMENT '1: Đang dùng, 0: Không dùng nữa',

    -- Ghi chú
    notes TEXT COMMENT 'Ghi chú về địa chỉ (landmark, hướng dẫn đường đi...)',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE RESTRICT,

    -- Indexes
    INDEX idx_customer_id (customer_id),
    INDEX idx_ward_id (ward_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Bảng lưu địa chỉ của khách hàng (1 customer nhiều addresses)';

-- =====================================================
-- Bước 3: Thêm contact_phone vào bảng contracts
-- Để lưu SĐT guest khi chưa có account (customer_id = NULL)
-- =====================================================
ALTER TABLE contracts
ADD COLUMN contact_phone VARCHAR(20) NULL COMMENT 'SĐT liên hệ - BẮT BUỘC khi customer_id = NULL (guest)'
AFTER customer_id;

CREATE INDEX idx_contracts_contact_phone ON contracts(contact_phone);

-- =====================================================
-- Bước 4: Link contracts với addresses
-- =====================================================
ALTER TABLE contracts
ADD COLUMN address_id INT NULL COMMENT 'ID địa chỉ lắp đặt (từ bảng addresses)'
AFTER contact_phone;

ALTER TABLE contracts
ADD CONSTRAINT fk_contracts_address
FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL;

CREATE INDEX idx_contracts_address_id ON contracts(address_id);

-- =====================================================
-- Bước 5: Link water_service_contracts với address
-- =====================================================
ALTER TABLE water_service_contracts
ADD COLUMN address_id INT NULL COMMENT 'ID địa chỉ sử dụng dịch vụ'
AFTER customer_id;

ALTER TABLE water_service_contracts
ADD CONSTRAINT fk_wsc_address
FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL;

CREATE INDEX idx_wsc_address_id ON water_service_contracts(address_id);

-- =====================================================
-- Bước 6: Link annul_transfer_contract_requests với address
-- =====================================================
ALTER TABLE annul_transfer_contract_requests
ADD COLUMN address_id INT NULL COMMENT 'ID địa chỉ (quan trọng khi chuyển nhượng)'
AFTER contract_id;

ALTER TABLE annul_transfer_contract_requests
ADD CONSTRAINT fk_transfer_address
FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL;

CREATE INDEX idx_transfer_address_id ON annul_transfer_contract_requests(address_id);

-- =====================================================
-- LƯU Ý: Nếu cần migrate dữ liệu cũ, chạy script riêng
-- Xem file: database/migrations/migrate_old_data_to_addresses.sql
-- =====================================================

