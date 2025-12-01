CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_type VARCHAR(100) NOT NULL,
  subject_id VARCHAR(100) NOT NULL,
  action VARCHAR(200) NOT NULL,
  actor_type VARCHAR(50),
  actor_id INT,
  initiator_type VARCHAR(50),
  initiator_id INT,
  initiator_name VARCHAR(255),
  payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_created_at (created_at),
  INDEX idx_activity_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

