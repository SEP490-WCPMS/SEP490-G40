-- =====================================================
-- V5: Fix - Cho phép customer_id, street_number, street_name NULL trong addresses
-- (Hỗ trợ địa chỉ tạm thời cho guest registration và vùng quê không có số nhà)
-- =====================================================

-- 1. Sửa lại customer_id thành NULLABLE
-- Vì: Guest đăng ký mới chưa có account → customer_id = NULL
ALTER TABLE addresses
MODIFY COLUMN customer_id INT NULL COMMENT 'ID khách hàng từ bảng customers - NULL nếu là địa chỉ tạm của guest';

-- 2. Sửa street thành NULLABLE
-- Vì: Một số địa chỉ vùng quê không có số nhà/tên đường rõ ràng
ALTER TABLE addresses
MODIFY COLUMN street VARCHAR(100) NULL COMMENT 'Số nhà, tên đường - NULL nếu vùng quê không có';

-- =====================================================
-- LƯU Ý:
-- - Địa chỉ tạm (customer_id = NULL) sẽ được link sau khi guest đăng ký thành công
-- - Frontend cần validate: Nếu customer_id = NULL thì PHẢI có contact_phone
-- - Địa chỉ vùng quê có thể NULL street_number hoặc street_name
-- =====================================================

