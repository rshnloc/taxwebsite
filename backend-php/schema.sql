-- Helpshack PHP/MySQL Database Schema
-- Run this to create all tables

CREATE DATABASE IF NOT EXISTS helpshack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE helpshack;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('client','employee','admin') DEFAULT 'client',
  avatar VARCHAR(500) DEFAULT '',
  address_street VARCHAR(255) DEFAULT NULL,
  address_city VARCHAR(100) DEFAULT NULL,
  address_state VARCHAR(100) DEFAULT NULL,
  address_pincode VARCHAR(10) DEFAULT NULL,
  pan VARCHAR(20) DEFAULT NULL,
  gst VARCHAR(20) DEFAULT NULL,
  company_name VARCHAR(255) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  designation VARCHAR(100) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  is_verified TINYINT(1) DEFAULT 0,
  otp VARCHAR(10) DEFAULT NULL,
  otp_expiry DATETIME DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expiry DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX idx_user_search (name, email, company_name)
) ENGINE=InnoDB;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) DEFAULT 'FileText',
  category ENUM('tax','registration','compliance','licensing','legal','other') NOT NULL,
  pricing_base_price DECIMAL(10,2) DEFAULT 0,
  pricing_gst_percent DECIMAL(5,2) DEFAULT 18,
  pricing_total_price DECIMAL(10,2) DEFAULT 0,
  pricing_is_custom TINYINT(1) DEFAULT 0,
  pricing_note VARCHAR(255) DEFAULT NULL,
  timeline VARCHAR(100) DEFAULT '7-10 working days',
  is_active TINYINT(1) DEFAULT 1,
  is_popular TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX idx_service_search (name, description)
) ENGINE=InnoDB;

-- Service required documents (JSON stored as rows)
CREATE TABLE IF NOT EXISTS service_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  is_mandatory TINYINT(1) DEFAULT 1,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Service features
CREATE TABLE IF NOT EXISTS service_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  feature VARCHAR(255) NOT NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Service process steps
CREATE TABLE IF NOT EXISTS service_process (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  step INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Service FAQs
CREATE TABLE IF NOT EXISTS service_faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id VARCHAR(20) NOT NULL UNIQUE,
  client_id INT NOT NULL,
  service_id INT NOT NULL,
  status ENUM('draft','submitted','under-review','in-progress','pending-documents','completed','rejected','cancelled') DEFAULT 'submitted',
  assigned_employee_id INT DEFAULT NULL,
  form_data JSON DEFAULT NULL,
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  payment_amount DECIMAL(10,2) DEFAULT 0,
  payment_gst DECIMAL(10,2) DEFAULT 0,
  payment_total DECIMAL(10,2) DEFAULT 0,
  payment_status ENUM('pending','partial','paid','refunded') DEFAULT 'pending',
  payment_razorpay_order_id VARCHAR(255) DEFAULT NULL,
  payment_razorpay_payment_id VARCHAR(255) DEFAULT NULL,
  payment_paid_at DATETIME DEFAULT NULL,
  due_date DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (assigned_employee_id) REFERENCES users(id),
  INDEX idx_app_client (client_id, status),
  INDEX idx_app_employee (assigned_employee_id, status),
  INDEX idx_app_created (created_at)
) ENGINE=InnoDB;

-- Application documents
CREATE TABLE IF NOT EXISTS application_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) DEFAULT NULL,
  path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  size INT DEFAULT NULL,
  uploaded_by INT DEFAULT NULL,
  category VARCHAR(50) DEFAULT 'general',
  is_completed TINYINT(1) DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Application notes
CREATE TABLE IF NOT EXISTS application_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  text TEXT NOT NULL,
  author_id INT DEFAULT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Application timeline
CREATE TABLE IF NOT EXISTS application_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  status VARCHAR(50),
  message TEXT,
  updated_by INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending','in-progress','review','completed','on-hold') DEFAULT 'pending',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  due_date DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_task_assigned (assigned_to, status),
  INDEX idx_task_app (application_id)
) ENGINE=InnoDB;

-- Task remarks
CREATE TABLE IF NOT EXISTS task_remarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  text TEXT NOT NULL,
  author_id INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  last_message_content TEXT DEFAULT NULL,
  last_message_sender_id INT DEFAULT NULL,
  last_message_timestamp DATETIME DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  INDEX idx_chatroom_app (application_id)
) ENGINE=InnoDB;

-- Chat room participants
CREATE TABLE IF NOT EXISTS chat_room_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uniq_room_user (room_id, user_id)
) ENGINE=InnoDB;

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text','file','image','system') DEFAULT 'text',
  file_url VARCHAR(500) DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_msg_room (room_id, created_at)
) ENGINE=InnoDB;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  application_id INT NOT NULL,
  client_id INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  gst_percent DECIMAL(5,2) DEFAULT 18,
  gst_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  due_date DATETIME DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  pdf_path VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (client_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity INT DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error','task','payment','application','chat') DEFAULT 'info',
  link VARCHAR(500) DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notif_user (user_id, is_read, created_at)
) ENGINE=InnoDB;

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity ENUM('user','application','task','service','invoice','payment','document') NOT NULL,
  entity_id INT DEFAULT NULL,
  details JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_activity_user (user_id, created_at),
  INDEX idx_activity_entity (entity, entity_id)
) ENGINE=InnoDB;
