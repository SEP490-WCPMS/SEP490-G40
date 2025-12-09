-- V12__Add_service_staff_to_annul_transfer_requests.sql

ALTER TABLE annul_transfer_contract_requests
    ADD COLUMN service_staff_id INT NULL AFTER approval_status;

ALTER TABLE annul_transfer_contract_requests
    ADD KEY idx_annul_transfer_service_staff (service_staff_id);

ALTER TABLE annul_transfer_contract_requests
    ADD CONSTRAINT fk_annul_transfer_service_staff
        FOREIGN KEY (service_staff_id) REFERENCES accounts(id)
            ON DELETE SET NULL;