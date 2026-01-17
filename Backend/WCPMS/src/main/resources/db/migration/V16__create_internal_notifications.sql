/* Bảng thông báo nội bộ (Internal Notifications) */

CREATE TABLE IF NOT EXISTS `internal_notifications` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `recipient_id` INT DEFAULT NULL COMMENT 'ID nhân viên nhận (nếu null thì check theo role)',
    `recipient_role` VARCHAR(50) DEFAULT NULL COMMENT 'Role nhận thông báo (VD: ADMIN, SERVICE_STAFF)',
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `reference_id` INT DEFAULT NULL COMMENT 'ID đối tượng liên quan (VD: Contract ID)',
    `reference_type` VARCHAR(50) DEFAULT NULL COMMENT 'Loại thông báo (Enum)',
    `is_read` TINYINT(1) DEFAULT '0',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_recipient` (`recipient_id`, `recipient_role`, `is_read`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;