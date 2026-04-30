-- ============================================================
-- Migration v2: RBAC, Client Types, RM Assignments, Doc Passwords
-- Run: mysql -u raushan -h 127.0.0.1 helpshack < migrate-v2.sql
-- ============================================================

USE helpshack;

-- ── Dynamic Roles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  is_system TINYINT(1) DEFAULT 0,  -- 1 = built-in (admin/employee/client), cannot delete
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Permissions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(100) NOT NULL,       -- e.g. 'applications', 'services', 'users'
  action VARCHAR(50) NOT NULL,        -- 'create','read','update','delete','export'
  label VARCHAR(255) NOT NULL,        -- Human-readable
  description VARCHAR(500) DEFAULT NULL,
  UNIQUE KEY uniq_module_action (module, action)
) ENGINE=InnoDB;

-- ── Role <-> Permission mapping ───────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_role_perm (role_id, permission_id)
) ENGINE=InnoDB;

-- ── User <-> Role (dynamic role assignment) ───────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT DEFAULT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE KEY uniq_user_role (user_id, role_id)
) ENGINE=InnoDB;

-- ── Client Types ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  required_fields JSON DEFAULT NULL,   -- e.g. ["pan","gst","company_name"]
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Extend users table ────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS client_type_id INT DEFAULT NULL AFTER role,
  ADD COLUMN IF NOT EXISTS dynamic_role_id INT DEFAULT NULL AFTER client_type_id;

-- ── Relationship Manager Assignments ─────────────────────
CREATE TABLE IF NOT EXISTS rm_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rm_user_id INT NOT NULL,           -- the RM (employee/admin)
  client_user_id INT DEFAULT NULL,   -- individual client
  company_name VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  assigned_by INT DEFAULT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unassigned_at DATETIME DEFAULT NULL,
  FOREIGN KEY (rm_user_id) REFERENCES users(id),
  FOREIGN KEY (client_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_rm_user (rm_user_id),
  INDEX idx_rm_client (client_user_id)
) ENGINE=InnoDB;

-- ── Document uploads with password ───────────────────────
ALTER TABLE application_documents
  ADD COLUMN IF NOT EXISTS doc_password_enc VARCHAR(500) DEFAULT NULL AFTER size,
  ADD COLUMN IF NOT EXISTS doc_password_hint VARCHAR(255) DEFAULT NULL AFTER doc_password_enc,
  ADD COLUMN IF NOT EXISTS is_password_protected TINYINT(1) DEFAULT 0 AFTER doc_password_hint,
  ADD COLUMN IF NOT EXISTS upload_status ENUM('pending','verified','rejected') DEFAULT 'pending' AFTER is_password_protected;

-- ── Seed: System roles ────────────────────────────────────
INSERT IGNORE INTO roles (name, slug, description, is_system) VALUES
  ('Admin',      'admin',     'Full system access',             1),
  ('Employee',   'employee',  'Handle applications and tasks',  1),
  ('Client',     'client',    'Apply for services',             1),
  ('Team Lead',  'team-lead', 'Manage team tasks and clients',  0),
  ('Supervisor', 'supervisor','Oversee operations',             0);

-- ── Seed: All permissions ─────────────────────────────────
INSERT IGNORE INTO permissions (module, action, label) VALUES
  ('dashboard',     'read',   'View Dashboard'),
  ('applications',  'create', 'Create Applications'),
  ('applications',  'read',   'View Applications'),
  ('applications',  'update', 'Update Applications'),
  ('applications',  'delete', 'Delete Applications'),
  ('applications',  'export', 'Export Applications'),
  ('services',      'create', 'Create Services'),
  ('services',      'read',   'View Services'),
  ('services',      'update', 'Update Services'),
  ('services',      'delete', 'Delete Services'),
  ('users',         'create', 'Create Users'),
  ('users',         'read',   'View Users'),
  ('users',         'update', 'Update Users'),
  ('users',         'delete', 'Delete Users'),
  ('tasks',         'create', 'Create Tasks'),
  ('tasks',         'read',   'View Tasks'),
  ('tasks',         'update', 'Update Tasks'),
  ('tasks',         'delete', 'Delete Tasks'),
  ('invoices',      'create', 'Create Invoices'),
  ('invoices',      'read',   'View Invoices'),
  ('invoices',      'update', 'Update Invoices'),
  ('reports',       'read',   'View Reports'),
  ('reports',       'export', 'Export Reports'),
  ('chat',          'read',   'View Chat'),
  ('chat',          'create', 'Send Messages'),
  ('documents',     'create', 'Upload Documents'),
  ('documents',     'read',   'View Documents'),
  ('rm',            'read',   'View RM Assignments'),
  ('rm',            'update', 'Manage RM Assignments'),
  ('roles',         'create', 'Create Roles'),
  ('roles',         'read',   'View Roles'),
  ('roles',         'update', 'Update Roles'),
  ('roles',         'delete', 'Delete Roles'),
  ('client_types',  'create', 'Create Client Types'),
  ('client_types',  'read',   'View Client Types'),
  ('client_types',  'update', 'Update Client Types'),
  ('client_types',  'delete', 'Delete Client Types');

-- ── Seed: Admin gets all permissions ─────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.slug = 'admin';

-- ── Seed: Employee permissions ────────────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.module IN ('dashboard','applications','tasks','chat','documents')
  AND p.action IN ('read','create','update')
WHERE r.slug = 'employee';

-- ── Seed: Client permissions ──────────────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON (
  (p.module = 'dashboard'     AND p.action = 'read') OR
  (p.module = 'applications'  AND p.action IN ('create','read')) OR
  (p.module = 'documents'     AND p.action IN ('create','read')) OR
  (p.module = 'chat'          AND p.action IN ('read','create'))
)
WHERE r.slug = 'client';

-- ── Seed: Team Lead permissions ───────────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.module IN ('dashboard','applications','tasks','chat','documents','reports')
  AND p.action IN ('read','create','update','export')
WHERE r.slug = 'team-lead';

-- ── Seed: Client Types ────────────────────────────────────
INSERT IGNORE INTO client_types (name, slug, description, required_fields) VALUES
  ('Individual',       'individual',       'Single person / salaried client',    '["pan"]'),
  ('Company',          'company',          'Registered company / business',       '["pan","gst","company_name"]'),
  ('Channel Partner',  'channel-partner',  'Partner who brings in other clients', '["pan","company_name"]');

-- ── Dynamic Document Fields (v3) ──────────────────────────
ALTER TABLE service_documents
  ADD COLUMN IF NOT EXISTS password_enabled TINYINT(1) DEFAULT 0 AFTER is_mandatory,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0 AFTER password_enabled;

ALTER TABLE application_documents
  ADD COLUMN IF NOT EXISTS field_name VARCHAR(255) DEFAULT NULL AFTER category;

-- ── Service Icon URL (v4) ─────────────────────────────────
ALTER TABLE services MODIFY COLUMN icon VARCHAR(20) DEFAULT '📄';
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500) DEFAULT NULL AFTER icon;

-- ── Document Field Types (v4) ─────────────────────────────
CREATE TABLE IF NOT EXISTS document_field_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  icon        VARCHAR(10)  DEFAULT '📄',
  is_active   TINYINT(1)   DEFAULT 1,
  sort_order  INT          DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO document_field_types (name, description, icon, sort_order) VALUES
  ('PAN Card',         'Permanent Account Number card',              '🪪', 1),
  ('Aadhaar Card',     'UIDAI Aadhaar identity card (front & back)', '🪪', 2),
  ('Passport',         'Valid passport copy',                        '🛂', 3),
  ('Passport Photo',   'Recent passport-size photograph',            '🖼️', 4),
  ('Voter ID',         'Election Commission voter identity card',    '🗳️', 5),
  ('Driving Licence',  'Valid driving licence',                      '🚗', 6),
  ('Bank Statement',   'Last 6 months bank statement',               '🏦', 7),
  ('GST Certificate',  'GSTIN registration certificate',             '📜', 8),
  ('ITR',              'Income Tax Return filing copy',              '📄', 9),
  ('Form 16',          'Employer-issued Form 16',                    '📄', 10),
  ('Utility Bill',     'Electricity / water / gas bill',             '💡', 11),
  ('Rent Agreement',   'Rental / lease agreement',                   '🏠', 12),
  ('Company PAN',      'Company Permanent Account Number',           '🏢', 13),
  ('MOA / AOA',        'Memorandum and Articles of Association',     '📑', 14),
  ('Certificate of Incorporation', 'Company incorporation certificate', '🏢', 15),
  ('Digital Signature','DSC (Class 2/3)',                            '🔑', 16),
  ('Cancelled Cheque', 'Cancelled cheque for bank details',         '🏦', 17),
  ('Salary Slip',      'Last 3 months salary slips',                '💼', 18),
  ('Property Documents','Sale deed / ownership proof',              '🏘️', 19),
  ('Other',            'Any other supporting document',             '📎', 20);

-- Service Categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(20)  DEFAULT '📁',
  description TEXT,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories from existing hardcoded list
INSERT IGNORE INTO service_categories (name, slug, icon, sort_order) VALUES
  ('Tax',          'tax',          '🧾', 1),
  ('Registration', 'registration', '🏢', 2),
  ('Compliance',   'compliance',   '✅', 3),
  ('Licensing',    'licensing',    '📜', 4),
  ('Legal',        'legal',        '⚖️', 5),
  ('Other',        'other',        '📄', 99);

-- User profile extras (v5)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS alt_phone VARCHAR(20) DEFAULT NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL AFTER alt_phone;

-- Timeline entry type (v5)
ALTER TABLE application_timeline
  ADD COLUMN IF NOT EXISTS entry_type ENUM('status_change','remark','feedback','document') DEFAULT 'status_change' AFTER message,
  ADD COLUMN IF NOT EXISTS is_internal TINYINT(1) DEFAULT 0 AFTER entry_type;
-- Back-fill existing rows
UPDATE application_timeline SET entry_type = 'status_change' WHERE entry_type IS NULL OR entry_type = '';
