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
