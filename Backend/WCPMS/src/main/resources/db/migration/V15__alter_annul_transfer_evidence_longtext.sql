-- V15__alter_annul_transfer_evidence_longtext.sql
-- Fix lỗi "Data too long" khi KH đính kèm minh chứng (base64) cho yêu cầu Chuyển nhượng/Hủy hợp đồng.

ALTER TABLE annul_transfer_contract_requests
    MODIFY COLUMN attached_evidence LONGTEXT NULL;
