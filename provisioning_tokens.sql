-- Tabla para tokens de provisioning de empresas
-- Empresas: SAB-5 (1), CONSISA (2), BROUCLEAN (3)

CREATE TABLE provisioning_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    activation_code VARCHAR(20) UNIQUE NOT NULL,
    company_id INT NOT NULL,
    company_name VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME NULL,
    created_by_admin_id INT NULL,

    INDEX idx_token (token),
    INDEX idx_activation_code (activation_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar token de ejemplo para testing (opcional)
-- INSERT INTO provisioning_tokens
-- (token, activation_code, company_id, company_name, expires_at)
-- VALUES
-- ('test-token-sab5', 'SAB5-TEST-TEST-TEST', 1, 'SAB-5', DATE_ADD(NOW(), INTERVAL 48 HOUR));
