-- Thêm cột accounting_staff_id vào bảng contracts
ALTER TABLE contracts
    ADD COLUMN accounting_staff_id INT NULL AFTER technical_staff_id;

-- Tạo FK sang bảng accounts
ALTER TABLE contracts
    ADD CONSTRAINT fk_contracts_accounts_accounting_assigned
        FOREIGN KEY (accounting_staff_id) REFERENCES accounts(id);