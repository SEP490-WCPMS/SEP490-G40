-- Cho phép cột customer_id nhận giá trị NULL trong bảng contracts
ALTER TABLE contracts MODIFY COLUMN customer_id INT NULL;