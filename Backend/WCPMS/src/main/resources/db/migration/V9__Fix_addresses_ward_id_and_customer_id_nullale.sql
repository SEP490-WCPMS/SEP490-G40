-- Cho phép ward_id và customer_id được NULL
ALTER TABLE addresses MODIFY COLUMN ward_id INT NULL;
ALTER TABLE addresses MODIFY COLUMN customer_id INT NULL;