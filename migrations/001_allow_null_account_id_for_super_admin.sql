-- ========================================================
-- Migration: Allow NULL account_id for super_admin users
-- ========================================================
-- Description:
--   According to FIRESTORE_STRUCTURE.md documentation:
--   - super_admin users don't belong to any specific account
--   - account_id should be NULL for super_admin role
--   - Other roles (account_admin, entity_admin, entity_user) MUST have account_id
--
-- Date: 2025-01-20
-- ========================================================

-- Step 1: Modify the account_users table to allow NULL in account_id column
ALTER TABLE account_users
MODIFY COLUMN account_id INT NULL
COMMENT 'Account ID (NULL for super_admin users, required for other roles)';

-- Step 2: Add index for better query performance (optional but recommended)
-- This helps queries that filter by account_id
CREATE INDEX idx_account_users_account_id ON account_users(account_id);

-- Step 3: Verification query (run this after migration to verify)
-- SELECT uid, name, email, role, account_id, is_active
-- FROM account_users
-- WHERE role = 'super_admin' OR account_id IS NULL;

-- ========================================================
-- IMPORTANT NOTES:
-- ========================================================
-- 1. The application layer (admin.controller.js) already validates that:
--    - super_admin users have account_id = NULL
--    - Other roles require account_id to be NOT NULL
--
-- 2. MySQL doesn't support CHECK constraints with complex conditions well,
--    so validation is done at the application level.
--
-- 3. After running this migration, you can create super_admin users with:
--    POST /api/v2/admin/users
--    {
--      "email": "superadmin@system.com",
--      "password": "SecurePass123!",
--      "name": "Super Admin",
--      "role": "super_admin",
--      "account_id": null,
--      "is_active": true
--    }
-- ========================================================
