-- V3: Thêm cột actor_name vào bảng activity_log và backfill dữ liệu
-- Thực hiện bằng Flyway (chạy tự động khi ứng dụng khởi động hoặc bằng command flyway:migrate)

ALTER TABLE activity_log
  ADD COLUMN actor_name VARCHAR(255) NULL AFTER actor_id;

-- Tạo index để tìm kiếm nhanh theo tên người thực hiện (nếu cần)
CREATE INDEX IF NOT EXISTS idx_activity_actor_name ON activity_log (actor_name(191));

-- Backfill: nếu có actor_id (liên kết tới accounts.id) thì lấy full_name
-- Lưu ý: trường full_name trong bảng accounts được dùng làm nguồn tên hiển thị
UPDATE activity_log a
JOIN accounts acc ON acc.id = a.actor_id
SET a.actor_name = acc.full_name
WHERE a.actor_id IS NOT NULL AND (a.actor_name IS NULL OR a.actor_name = '');

-- Fallback: với các bản ghi chưa có actor_name nhưng có initiator_name, dùng initiator_name
UPDATE activity_log
SET actor_name = initiator_name
WHERE (actor_name IS NULL OR actor_name = '') AND (initiator_name IS NOT NULL AND TRIM(initiator_name) <> '');

-- An toàn: chỉ thực thi update nếu bảng accounts tồn tại
-- (Flyway sẽ fail nếu DB khác cú pháp; kiểm tra môi trường trước khi chạy trên production)

-- End of V3

