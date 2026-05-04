<?php
/**
 * Helpshack PHP API - Main Router
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS
$config = require __DIR__ . '/config.php';
$allowedOrigins = [
    $config['FRONTEND_URL'] ?? 'http://localhost:3000',
    'https://tax.careerxera.com',
    'http://localhost:3000',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins) || !$origin) {
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Serve static uploads (service icons etc.)
if (preg_match('#^/uploads/(.+)$#', $_SERVER['REQUEST_URI'] ?? '', $um)) {
    $file = __DIR__ . '/uploads/' . $um[1];
    if (is_file($file)) {
        $mime = mime_content_type($file) ?: 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=86400');
        readfile($file);
        exit;
    }
    http_response_code(404); exit;
}

// Autoload
try {
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/helpers.php';
require_once __DIR__ . '/src/Mailer.php';
require_once __DIR__ . '/src/controllers/AuthController.php';
require_once __DIR__ . '/src/controllers/UserController.php';
require_once __DIR__ . '/src/controllers/ServiceController.php';
require_once __DIR__ . '/src/controllers/ApplicationController.php';
require_once __DIR__ . '/src/controllers/TaskController.php';
require_once __DIR__ . '/src/controllers/ChatController.php';
require_once __DIR__ . '/src/controllers/InvoiceController.php';
require_once __DIR__ . '/src/controllers/PaymentController.php';
require_once __DIR__ . '/src/controllers/NotificationController.php';
require_once __DIR__ . '/src/controllers/DashboardController.php';
require_once __DIR__ . '/src/controllers/RoleController.php';
require_once __DIR__ . '/src/controllers/ClientTypeController.php';
require_once __DIR__ . '/src/controllers/RMController.php';
require_once __DIR__ . '/src/controllers/DocumentController.php';
require_once __DIR__ . '/src/controllers/DocumentFieldTypeController.php';
require_once __DIR__ . '/src/controllers/ServiceCategoryController.php';
require_once __DIR__ . '/src/controllers/PartnerController.php';
require_once __DIR__ . '/src/controllers/RateCardController.php';
require_once __DIR__ . '/src/controllers/PartnerServiceRequestController.php';
require_once __DIR__ . '/src/controllers/PerformanceController.php';
require_once __DIR__ . '/src/controllers/PaymentAccountController.php';
require_once __DIR__ . '/src/controllers/PartnerInvoiceController.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Bootstrap error: ' . $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
    exit;
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Remove base path if running in subdirectory
$basePath = dirname($_SERVER['SCRIPT_NAME']);
if ($basePath !== '/' && $basePath !== '\\') {
    $uri = substr($uri, strlen($basePath));
}
$uri = '/' . trim($uri, '/');
if (preg_match('#^/api/v1(?:/|$)#', $uri)) {
    $uri = preg_replace('#^/api/v1#', '/api', $uri, 1);
}
if ($uri !== '/' && !preg_match('#^/api(?:/|$)#', $uri)) {
    $uri = '/api' . $uri;
}

// Simple router
try {
    route($method, $uri);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
}

function route($method, $uri) {
    // Health check
    if ($uri === '/api/health') {
        jsonResponse(['status' => 'ok', 'timestamp' => date('c'), 'name' => 'Helpshack PHP API']);
    }

    // SMTP test (admin only)
    if ($uri === '/api/admin/test-email' && $method === 'POST') {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $to = $data['email'] ?? null;
        if (!$to) jsonResponse(['error' => 'email required'], 422);
        try {
            Mailer::sendOtpEmail($to, 'Test User', '123456');
            jsonResponse(['success' => true, 'message' => 'Test email sent to ' . $to]);
        } catch (Throwable $e) {
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // ===== AUTH =====
    if ($uri === '/api/auth/register' && $method === 'POST') return AuthController::register();
    if ($uri === '/api/auth/login' && $method === 'POST') return AuthController::login();
    if ($uri === '/api/auth/me' && $method === 'GET') return AuthController::getMe();
    if ($uri === '/api/auth/profile' && $method === 'PUT') return AuthController::updateProfile();
    if ($uri === '/api/auth/change-password' && $method === 'PUT') return AuthController::changePassword();
    if ($uri === '/api/auth/avatar' && $method === 'POST') return AuthController::uploadAvatar();
    if ($uri === '/api/auth/forgot-password' && $method === 'POST') return AuthController::forgotPassword();
    if ($uri === '/api/auth/verify-otp' && $method === 'POST') return AuthController::verifyOTP();
    if ($uri === '/api/auth/resend-otp' && $method === 'POST') return AuthController::resendOTP();

    // ===== USERS =====
    if ($uri === '/api/users' && $method === 'GET') return UserController::getUsers();
    if ($uri === '/api/users' && $method === 'POST') return UserController::createUser();
    if ($uri === '/api/users/employees' && $method === 'GET') return UserController::getEmployees();
    if ($uri === '/api/employee/profile' && $method === 'GET') return UserController::getMyProfile();
    if ($uri === '/api/admin/birthday-check' && $method === 'POST') return UserController::runBirthdayCheck();
    if ($uri === '/api/admin/birthday-today' && $method === 'GET') return UserController::getBirthdaysToday();
    if (preg_match('#^/api/users/(\d+)$#', $uri, $m)) {
        if ($method === 'GET') return UserController::getUserById($m[1]);
        if ($method === 'PUT') return UserController::updateUser($m[1]);
        if ($method === 'DELETE') return UserController::deleteUser($m[1]);
    }

    // ===== SERVICES =====
    if ($uri === '/api/services' && $method === 'GET') return ServiceController::getServices();
    if ($uri === '/api/services' && $method === 'POST') return ServiceController::createService();
    if (preg_match('#^/api/services/([a-z0-9-]+)/config$#', $uri, $m) && $method === 'GET') {
        return ServiceController::getServiceConfig($m[1]);
    }
    if (preg_match('#^/api/services/(\d+)/icon$#', $uri, $m) && $method === 'POST') {
        return ServiceController::uploadIcon($m[1]);
    }
    if (preg_match('#^/api/services/(\d+)$#', $uri, $m)) {
        if ($method === 'PUT') return ServiceController::updateService($m[1]);
        if ($method === 'DELETE') return ServiceController::deleteService($m[1]);
    }
    if (preg_match('#^/api/services/([a-z0-9-]+)$#', $uri, $m) && $method === 'GET') {
        return ServiceController::getServiceBySlug($m[1]);
    }

    // ===== MIGRATIONS (admin only, run once) =====
    if ($uri === '/api/admin/migrate' && $method === 'POST') {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $ran = [];
        $cols = $db->query("SHOW COLUMNS FROM applications LIKE 'rating'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE applications ADD COLUMN rating TINYINT DEFAULT NULL");
            $db->exec("ALTER TABLE applications ADD COLUMN rating_feedback TEXT DEFAULT NULL");
            $db->exec("ALTER TABLE applications ADD COLUMN rated_at DATETIME DEFAULT NULL");
            $ran[] = 'Added rating columns to applications';
        }
        $tl = $db->query("SHOW COLUMNS FROM application_timeline LIKE 'entry_type'")->fetchAll();
        if (empty($tl)) {
            $db->exec("ALTER TABLE application_timeline ADD COLUMN entry_type VARCHAR(50) DEFAULT 'status_change'");
            $db->exec("ALTER TABLE application_timeline ADD COLUMN is_internal TINYINT(1) DEFAULT 0");
            $ran[] = 'Added entry_type/is_internal columns to application_timeline';
        }
        // Employee new fields
        $jd = $db->query("SHOW COLUMNS FROM users LIKE 'joining_date'")->fetchAll();
        if (empty($jd)) {
            $db->exec("ALTER TABLE users ADD COLUMN joining_date DATE DEFAULT NULL");
            $ran[] = 'Added joining_date column to users';
        }
        $dobCol = $db->query("SHOW COLUMNS FROM users LIKE 'dob'")->fetchAll();
        if (empty($dobCol)) {
            $db->exec("ALTER TABLE users ADD COLUMN dob DATE DEFAULT NULL");
            $ran[] = 'Added dob column to users';
        }
        $lwdCol = $db->query("SHOW COLUMNS FROM users LIKE 'last_working_day'")->fetchAll();
        if (empty($lwdCol)) {
            $db->exec("ALTER TABLE users ADD COLUMN last_working_day DATE DEFAULT NULL");
            $ran[] = 'Added last_working_day column to users';
        }
        $esCol = $db->query("SHOW COLUMNS FROM users LIKE 'employment_status'")->fetchAll();
        if (empty($esCol)) {
            $db->exec("ALTER TABLE users ADD COLUMN employment_status VARCHAR(20) DEFAULT 'active'");
            $ran[] = 'Added employment_status column to users';
        }
        // Partner columns on users
        $pcol = $db->query("SHOW COLUMNS FROM users LIKE 'partner_status'")->fetchAll();
        if (empty($pcol)) {
            $db->exec("ALTER TABLE users ADD COLUMN partner_status VARCHAR(30) DEFAULT NULL");
            $ran[] = 'Added partner_status column to users';
        }
        $pcol2 = $db->query("SHOW COLUMNS FROM users LIKE 'partner_assigned_reviewer'")->fetchAll();
        if (empty($pcol2)) {
            $db->exec("ALTER TABLE users ADD COLUMN partner_assigned_reviewer INT DEFAULT NULL");
            $ran[] = 'Added partner_assigned_reviewer column to users';
        }
        $pcol3 = $db->query("SHOW COLUMNS FROM users LIKE 'aadhaar'")->fetchAll();
        if (empty($pcol3)) {
            $db->exec("ALTER TABLE users ADD COLUMN aadhaar VARCHAR(20) DEFAULT NULL");
            $ran[] = 'Added aadhaar column to users';
        }
        $pcol4 = $db->query("SHOW COLUMNS FROM users LIKE 'partner_about'")->fetchAll();
        if (empty($pcol4)) {
            $db->exec("ALTER TABLE users ADD COLUMN partner_about TEXT DEFAULT NULL");
            $ran[] = 'Added partner_about column to users';
        }
        $pcol5 = $db->query("SHOW COLUMNS FROM users LIKE 'registered_date'")->fetchAll();
        if (empty($pcol5)) {
            $db->exec("ALTER TABLE users ADD COLUMN registered_date DATE DEFAULT NULL");
            $ran[] = 'Added registered_date column to users';
        }
        // Partner review logs
        $prl = $db->query("SHOW TABLES LIKE 'partner_review_logs'")->fetchAll();
        if (empty($prl)) {
            $db->exec("CREATE TABLE partner_review_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                partner_id INT NOT NULL,
                reviewer_id INT NOT NULL,
                action VARCHAR(50) NOT NULL,
                comments TEXT,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_review_logs table';
        }
        // Partner rate cards
        $prc = $db->query("SHOW TABLES LIKE 'partner_rate_cards'")->fetchAll();
        if (empty($prc)) {
            $db->exec("CREATE TABLE partner_rate_cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                partner_id INT NOT NULL,
                service_id INT NOT NULL,
                base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                partner_price DECIMAL(10,2) NOT NULL,
                commission DECIMAL(10,2) DEFAULT NULL,
                margin_percent DECIMAL(5,2) DEFAULT NULL,
                effective_date DATE NOT NULL,
                expiry_date DATE DEFAULT NULL,
                status VARCHAR(30) DEFAULT 'rate_pending_approval',
                partner_feedback TEXT,
                notes TEXT,
                created_by INT NOT NULL,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_rate_cards table';
        }
        // Partner rate card history
        $prch = $db->query("SHOW TABLES LIKE 'partner_rate_card_history'")->fetchAll();
        if (empty($prch)) {
            $db->exec("CREATE TABLE partner_rate_card_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rate_card_id INT NOT NULL,
                changed_by INT NOT NULL,
                old_data JSON,
                new_data JSON,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_rate_card_history table';
        }
        // Partner audit logs
        $pal = $db->query("SHOW TABLES LIKE 'partner_audit_logs'")->fetchAll();
        if (empty($pal)) {
            $db->exec("CREATE TABLE partner_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                partner_id INT NOT NULL,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                entity VARCHAR(50) DEFAULT NULL,
                entity_id INT DEFAULT NULL,
                comments TEXT,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_audit_logs table';
        }
        // Partner service requests
        $psr = $db->query("SHOW TABLES LIKE 'partner_service_requests'")->fetchAll();
        if (empty($psr)) {
            $db->exec("CREATE TABLE partner_service_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reference VARCHAR(20) NOT NULL UNIQUE,
                partner_id INT NOT NULL,
                service_id INT NOT NULL,
                rate_card_id INT NOT NULL,
                agreed_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                client_name VARCHAR(100) NOT NULL,
                client_email VARCHAR(255) DEFAULT NULL,
                client_phone VARCHAR(20) DEFAULT NULL,
                dynamic_data JSON DEFAULT NULL,
                status ENUM('submitted','under-review','in-progress','completed','rejected','cancelled') DEFAULT 'submitted',
                admin_comments TEXT DEFAULT NULL,
                assigned_employee_id INT DEFAULT NULL,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_service_requests table';
        }
        // Partner request documents
        $prd = $db->query("SHOW TABLES LIKE 'partner_request_documents'")->fetchAll();
        if (empty($prd)) {
            $db->exec("CREATE TABLE partner_request_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                field_key VARCHAR(100) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                stored_name VARCHAR(255) NOT NULL,
                path VARCHAR(500) NOT NULL,
                mime_type VARCHAR(100) DEFAULT NULL,
                size INT DEFAULT 0,
                is_password_protected TINYINT(1) DEFAULT 0,
                doc_password VARCHAR(255) DEFAULT NULL,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_request_documents table';
        }
        // Payment accounts
        $pa = $db->query("SHOW TABLES LIKE 'payment_accounts'")->fetchAll();
        if (empty($pa)) {
            $db->exec("CREATE TABLE payment_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('bank','upi') NOT NULL,
                label VARCHAR(100) DEFAULT NULL,
                account_holder VARCHAR(100) DEFAULT NULL,
                account_number VARCHAR(50) DEFAULT NULL,
                ifsc_code VARCHAR(20) DEFAULT NULL,
                bank_name VARCHAR(100) DEFAULT NULL,
                branch VARCHAR(100) DEFAULT NULL,
                upi_id VARCHAR(100) DEFAULT NULL,
                qr_code_path VARCHAR(500) DEFAULT NULL,
                is_default TINYINT(1) DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created payment_accounts table';
        }
        // Partner invoices
        $pinv = $db->query("SHOW TABLES LIKE 'partner_invoices'")->fetchAll();
        if (empty($pinv)) {
            $db->exec("CREATE TABLE partner_invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_number VARCHAR(30) NOT NULL UNIQUE,
                partner_id INT NOT NULL,
                billing_period_start DATE NOT NULL,
                billing_period_end DATE NOT NULL,
                payment_account_id INT DEFAULT NULL,
                subtotal DECIMAL(10,2) DEFAULT 0,
                gst_percent DECIMAL(5,2) DEFAULT 0,
                gst_amount DECIMAL(10,2) DEFAULT 0,
                discount DECIMAL(10,2) DEFAULT 0,
                extra_charges DECIMAL(10,2) DEFAULT 0,
                extra_charges_note TEXT DEFAULT NULL,
                total DECIMAL(10,2) DEFAULT 0,
                status ENUM('auto_generated','pending_review','finalized','sent','paid','partial','overdue','cancelled') DEFAULT 'auto_generated',
                admin_notes TEXT DEFAULT NULL,
                due_date DATE DEFAULT NULL,
                sent_at DATETIME DEFAULT NULL,
                paid_at DATETIME DEFAULT NULL,
                payment_method VARCHAR(50) DEFAULT NULL,
                payment_reference VARCHAR(100) DEFAULT NULL,
                created_by INT DEFAULT NULL,
                reviewed_by INT DEFAULT NULL,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_invoices table';
        }
        // Partner invoice items
        $pii = $db->query("SHOW TABLES LIKE 'partner_invoice_items'")->fetchAll();
        if (empty($pii)) {
            $db->exec("CREATE TABLE partner_invoice_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_id INT NOT NULL,
                service_request_id INT DEFAULT NULL,
                service_id INT DEFAULT NULL,
                description VARCHAR(500) NOT NULL,
                quantity INT DEFAULT 1,
                rate DECIMAL(10,2) DEFAULT 0,
                amount DECIMAL(10,2) DEFAULT 0,
                item_type ENUM('service','deduction','extra','pending') DEFAULT 'service',
                sort_order INT DEFAULT 0,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_invoice_items table';
        }
        // Partner invoice payments
        $pip = $db->query("SHOW TABLES LIKE 'partner_invoice_payments'")->fetchAll();
        if (empty($pip)) {
            $db->exec("CREATE TABLE partner_invoice_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                reference VARCHAR(100) DEFAULT NULL,
                notes TEXT DEFAULT NULL,
                recorded_by INT NOT NULL,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB");
            $ran[] = 'Created partner_invoice_payments table';
        }
        // Tasks completed_at column
        $catCol = $db->query("SHOW COLUMNS FROM tasks LIKE 'completed_at'")->fetchAll();
        if (empty($catCol)) {
            $db->exec("ALTER TABLE tasks ADD COLUMN completed_at DATETIME DEFAULT NULL");
            $ran[] = 'Added completed_at column to tasks';
        }
        // User last_active_at (for online status)
        $lacCol = $db->query("SHOW COLUMNS FROM users LIKE 'last_active_at'")->fetchAll();
        if (empty($lacCol)) {
            $db->exec("ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT NULL");
            $ran[] = 'Added last_active_at column to users';
        }
        // Chat rooms is_flagged + flag_reason
        $flagCol = $db->query("SHOW COLUMNS FROM chat_rooms LIKE 'is_flagged'")->fetchAll();
        if (empty($flagCol)) {
            $db->exec("ALTER TABLE chat_rooms ADD COLUMN is_flagged TINYINT(1) DEFAULT 0");
            $db->exec("ALTER TABLE chat_rooms ADD COLUMN flag_reason VARCHAR(255) DEFAULT NULL");
            $ran[] = 'Added is_flagged/flag_reason to chat_rooms';
        }
        // Direct chat rooms (non-application rooms need room_type)
        $rtCol = $db->query("SHOW COLUMNS FROM chat_rooms LIKE 'room_type'")->fetchAll();
        if (empty($rtCol)) {
            $db->exec("ALTER TABLE chat_rooms ADD COLUMN room_type VARCHAR(30) DEFAULT 'application'");
            $db->exec("ALTER TABLE chat_rooms ADD COLUMN title VARCHAR(255) DEFAULT NULL");
            $ran[] = 'Added room_type/title to chat_rooms';
        }
        // Make chat_rooms.application_id nullable (required for direct/internal chat rooms)
        $crAppCol = $db->query("SHOW COLUMNS FROM chat_rooms LIKE 'application_id'")->fetchAll();
        if (!empty($crAppCol) && strtoupper($crAppCol[0]['Null'] ?? '') === 'NO') {
            $db->exec("ALTER TABLE chat_rooms MODIFY COLUMN application_id INT DEFAULT NULL");
            $ran[] = 'Made chat_rooms.application_id nullable';
        }
        // Add 'partner' to users.role ENUM (was missing — caused partner inserts to store role='')
        $roleCol = $db->query("SHOW COLUMNS FROM users LIKE 'role'")->fetchAll();
        if (!empty($roleCol)) {
            $roleType = $roleCol[0]['Type'] ?? '';
            if (strpos($roleType, 'partner') === false) {
                $db->exec("ALTER TABLE users MODIFY COLUMN role ENUM('client','employee','admin','partner') DEFAULT 'client'");
                $ran[] = 'Added partner to users.role ENUM';
            }
        }
        // Fix partner records stored with role='' due to missing ENUM value
        $badPartners = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = '' AND partner_status IS NOT NULL")->fetchColumn();
        if ($badPartners > 0) {
            $db->exec("UPDATE users SET role = 'partner' WHERE role = '' AND partner_status IS NOT NULL");
            $ran[] = "Fixed $badPartners partner records with empty role";
        }
        // Add 'pending_review' to tasks.status ENUM
        $taskStatusCol = $db->query("SHOW COLUMNS FROM tasks LIKE 'status'")->fetch();
        if ($taskStatusCol && strpos($taskStatusCol['Type'], 'pending_review') === false) {
            $db->exec("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending','in-progress','review','completed','on-hold','pending_review') DEFAULT 'pending'");
            $ran[] = 'Added pending_review to tasks.status ENUM';
        }
        // Create task_final_documents table
        $tfd = $db->query("SHOW TABLES LIKE 'task_final_documents'")->fetchAll();
        if (empty($tfd)) {
            $db->exec("CREATE TABLE task_final_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                doc_type VARCHAR(100) DEFAULT NULL,
                description TEXT DEFAULT NULL,
                password VARCHAR(255) DEFAULT NULL,
                original_name VARCHAR(255) DEFAULT NULL,
                path VARCHAR(500) NOT NULL,
                mime_type VARCHAR(100) DEFAULT NULL,
                size INT DEFAULT NULL,
                uploaded_by INT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (uploaded_by) REFERENCES users(id)
            ) ENGINE=InnoDB");
            $ran[] = 'Created task_final_documents table';
        }
        jsonResponse(['migrated' => $ran ?: ['Nothing to migrate — already up to date']]);
    }

    // ===== APPLICATIONS =====
    if ($uri === '/api/applications' && $method === 'GET') return ApplicationController::getApplications();
    if ($uri === '/api/applications' && $method === 'POST') return ApplicationController::createApplication();
    if ($uri === '/api/applications/my' && $method === 'GET') return ApplicationController::getMyApplications();
    if (preg_match('#^/api/applications/(\d+)/status$#', $uri, $m) && in_array($method, ['PUT', 'PATCH'])) {
        return ApplicationController::updateStatus($m[1]);
    }
    if (preg_match('#^/api/applications/(\d+)/remarks$#', $uri, $m) && $method === 'POST') {
        return ApplicationController::addRemark($m[1]);
    }
    if (preg_match('#^/api/applications/(\d+)/rate$#', $uri, $m) && $method === 'POST') {
        return ApplicationController::rateApplication($m[1]);
    }
    if (preg_match('#^/api/employees/(\d+)/ratings$#', $uri, $m) && $method === 'GET') {
        return ApplicationController::getEmployeeRatings($m[1]);
    }
    if (preg_match('#^/api/applications/(\d+)/assign$#', $uri, $m) && $method === 'PUT') {
        return ApplicationController::assignEmployee($m[1]);
    }
    if (preg_match('#^/api/applications/(\d+)/documents$#', $uri, $m) && $method === 'POST') {
        return DocumentController::uploadDocuments($m[1]);
    }
    if (preg_match('#^/api/applications/(\d+)$#', $uri, $m)) {
        if ($method === 'GET') return ApplicationController::getApplicationById($m[1]);
        if ($method === 'PUT') return ApplicationController::updateApplication($m[1]);
    }

    // ===== TASKS =====
    if ($uri === '/api/tasks' && $method === 'GET') return TaskController::getTasks();
    if ($uri === '/api/tasks' && $method === 'POST') return TaskController::createTask();
    if ($uri === '/api/admin/tasks/create-with-client' && $method === 'POST') return TaskController::createWithClient();
    if ($uri === '/api/tasks/my' && $method === 'GET') return TaskController::getMyTasks();
    if (preg_match('#^/api/tasks/(\d+)/status$#', $uri, $m) && in_array($method, ['PUT', 'PATCH'])) {
        return TaskController::updateTaskStatus($m[1]);
    }
    if (preg_match('#^/api/tasks/(\d+)/final-docs$#', $uri, $m)) {
        if ($method === 'GET')  return TaskController::getFinalDocs($m[1]);
        if ($method === 'POST') return TaskController::uploadFinalDocs($m[1]);
    }
    if (preg_match('#^/api/tasks/(\d+)/approve$#', $uri, $m) && $method === 'POST') {
        return TaskController::approveTask($m[1]);
    }
    if (preg_match('#^/api/tasks/(\d+)/reject$#', $uri, $m) && $method === 'POST') {
        return TaskController::rejectTask($m[1]);
    }
    if (preg_match('#^/api/tasks/(\d+)$#', $uri, $m)) {
        if ($method === 'GET') return TaskController::getTaskById($m[1]);
        if ($method === 'PUT') return TaskController::updateTask($m[1]);
    }

    // ===== CHAT =====
    if ($uri === '/api/chat/rooms' && $method === 'GET') return ChatController::getChatRooms();
    if ($uri === '/api/chat/rooms' && $method === 'POST') return ChatController::createChatRoom();
    // Also support old routes: /api/chat/conversations, /api/chat/messages/:id
    if ($uri === '/api/chat/conversations' && $method === 'GET') return ChatController::getChatRooms();
    if ($uri === '/api/chat/conversations' && $method === 'POST') return ChatController::createChatRoom();
    if (preg_match('#^/api/chat/rooms/(\d+)/messages$#', $uri, $m)) {
        if ($method === 'GET') return ChatController::getMessages($m[1]);
        if ($method === 'POST') return ChatController::sendMessage($m[1]);
    }
    if (preg_match('#^/api/chat/rooms/(\d+)/seen$#', $uri, $m) && in_array($method, ['PUT', 'PATCH'])) {
        return ChatController::markRoomSeen($m[1]);
    }
    if (preg_match('#^/api/chat/messages/(\d+)$#', $uri, $m) && $method === 'GET') {
        return ChatController::getMessages($m[1]);
    }
    if ($uri === '/api/chat/messages' && $method === 'POST') {
        // Legacy route: extract room from body
        $data = getJsonInput();
        if (isset($data['conversationId'])) return ChatController::sendMessage($data['conversationId']);
    }
    if (preg_match('#^/api/chat/rooms/(\d+)$#', $uri, $m) && $method === 'GET') {
        return ChatController::getChatRoom($m[1]);
    }
    if (preg_match('#^/api/chat/rooms/(\d+)/flag$#', $uri, $m) && $method === 'POST') {
        return ChatController::flagRoom($m[1]);
    }
    // Online status
    if ($uri === '/api/users/online-status' && $method === 'GET') return UserController::getOnlineStatus();

    // ===== INVOICES =====
    if ($uri === '/api/invoices' && $method === 'GET') return InvoiceController::getInvoices();
    if ($uri === '/api/invoices' && $method === 'POST') return InvoiceController::createInvoice();
    if ($uri === '/api/invoices/my' && $method === 'GET') return InvoiceController::getMyInvoices();
    if (preg_match('#^/api/invoices/(\d+)/pdf$#', $uri, $m) && $method === 'GET') {
        return InvoiceController::generatePDF($m[1]);
    }
    if (preg_match('#^/api/invoices/(\d+)/mark-paid$#', $uri, $m) && in_array($method, ['POST','PUT','PATCH'])) {
        return InvoiceController::markPaid($m[1]);
    }
    if (preg_match('#^/api/invoices/(\d+)/send-reminder$#', $uri, $m) && $method === 'POST') {
        return InvoiceController::sendReminder($m[1]);
    }
    if (preg_match('#^/api/invoices/(\d+)$#', $uri, $m)) {
        if ($method === 'GET') return InvoiceController::getInvoiceById($m[1]);
        if ($method === 'PUT') return InvoiceController::updateInvoice($m[1]);
    }

    // ===== PAYMENTS =====
    if ($uri === '/api/payments/create-order' && $method === 'POST') return PaymentController::createOrder();
    if ($uri === '/api/payments/verify' && $method === 'POST') return PaymentController::verifyPayment();
    if ($uri === '/api/payments/history' && $method === 'GET') return PaymentController::getPaymentHistory();

    // ===== NOTIFICATIONS =====
    if ($uri === '/api/notifications' && $method === 'GET') return NotificationController::getNotifications();
    if ($uri === '/api/notifications/unread-count' && $method === 'GET') return NotificationController::getUnreadCount();
    if ($uri === '/api/notifications/devices' && $method === 'POST') return NotificationController::registerDevice();
    if ($uri === '/api/notifications/read-all' && in_array($method, ['PUT', 'PATCH'])) return NotificationController::markAllAsRead();
    if (preg_match('#^/api/notifications/(\d+)/read$#', $uri, $m) && in_array($method, ['PUT', 'PATCH'])) {
        return NotificationController::markAsRead($m[1]);
    }

    // ===== DASHBOARD =====
    // Generic /api/dashboard — auto-routes by user role
    if ($uri === '/api/dashboard' && $method === 'GET') {
        $u = Auth::protect();
        if ($u['role'] === 'admin')    return DashboardController::getAdminDashboard();
        if ($u['role'] === 'employee') return DashboardController::getEmployeeDashboard();
        return DashboardController::getClientDashboard();
    }
    if ($uri === '/api/dashboard/admin' && $method === 'GET') return DashboardController::getAdminDashboard();
    if ($uri === '/api/dashboard/employee' && $method === 'GET') return DashboardController::getEmployeeDashboard();
    if ($uri === '/api/dashboard/client' && $method === 'GET') return DashboardController::getClientDashboard();
    if ($uri === '/api/dashboard/stats' && $method === 'GET') return DashboardController::getClientDashboard(); // alias
    if ($uri === '/api/dashboard/reports' && $method === 'GET') return DashboardController::getReports();

    // ===== ROLES & PERMISSIONS =====
    if ($uri === '/api/roles' && $method === 'GET')  return RoleController::getRoles();
    if ($uri === '/api/roles' && $method === 'POST') return RoleController::createRole();
    if ($uri === '/api/permissions' && $method === 'GET') return RoleController::getPermissions();
    if (preg_match('#^/api/roles/(\d+)/permissions$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return RoleController::updateRolePermissions($m[1]);
    }
    if (preg_match('#^/api/roles/(\d+)$#', $uri, $m)) {
        if ($method === 'GET')    return RoleController::getRoleById($m[1]);
        if ($method === 'PUT')    return RoleController::updateRole($m[1]);
        if ($method === 'DELETE') return RoleController::deleteRole($m[1]);
    }
    if (preg_match('#^/api/users/(\d+)/role$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return RoleController::assignUserRole($m[1]);
    }

    // ===== CLIENT TYPES =====
    if ($uri === '/api/client-types' && $method === 'GET')  return ClientTypeController::getClientTypes();
    if ($uri === '/api/client-types' && $method === 'POST') return ClientTypeController::createClientType();
    if (preg_match('#^/api/client-types/(\d+)$#', $uri, $m)) {
        if ($method === 'PUT')    return ClientTypeController::updateClientType($m[1]);
        if ($method === 'DELETE') return ClientTypeController::deleteClientType($m[1]);
    }
    if (preg_match('#^/api/users/(\d+)/client-type$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return ClientTypeController::assignClientType($m[1]);
    }

    // ===== RM ASSIGNMENTS =====
    if ($uri === '/api/rm/assignments' && $method === 'GET')  return RMController::getAssignments();
    if ($uri === '/api/rm/assignments' && $method === 'POST') return RMController::assignRM();
    if ($uri === '/api/rm/my-clients'  && $method === 'GET')  return RMController::getMyClients();
    if ($uri === '/api/rm/list'        && $method === 'GET')  return RMController::getRMList();
    if (preg_match('#^/api/rm/assignments/(\d+)$#', $uri, $m)) {
        if ($method === 'PUT')    return RMController::updateAssignment($m[1]);
        if ($method === 'DELETE') return RMController::unassignRM($m[1]);
    }

    // ===== DOCUMENTS =====
    if (preg_match('#^/api/applications/(\d+)/documents/upload$#', $uri, $m) && $method === 'POST') {
        return DocumentController::uploadDocuments($m[1]);
    }
    if (preg_match('#^/api/applications/(\d+)/documents$#', $uri, $m) && $method === 'GET') {
        return DocumentController::getDocuments($m[1]);
    }
    if (preg_match('#^/api/documents/(\d+)/password$#', $uri, $m) && $method === 'GET') {
        return DocumentController::getDocumentPassword($m[1]);
    }
    if (preg_match('#^/api/documents/(\d+)/status$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return DocumentController::updateDocumentStatus($m[1]);
    }

    // ===== MAIL TEST (admin only) =====
    if ($uri === '/api/mail/test' && $method === 'POST') {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $to = $data['email'] ?? '';
        if (!$to) jsonResponse(['error' => 'email required'], 422);
        try {
            $config = require __DIR__ . '/config.php';
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $config['MAIL_SMTP_HOST'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $config['MAIL_SMTP_USER'];
            $mail->Password   = $config['MAIL_SMTP_PASS'];
            $mail->Port       = (int)($config['MAIL_SMTP_PORT'] ?? 465);
            $mail->SMTPSecure = ($config['MAIL_SMTP_ENC'] ?? 'ssl') === 'tls'
                ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS
                : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            $mail->CharSet = 'UTF-8';
            $mail->setFrom($config['MAIL_FROM_EMAIL'], $config['MAIL_FROM_NAME']);
            $mail->addAddress($to);
            $mail->Subject = 'SMTP Test — Tax CareerXera';
            $mail->isHTML(true);
            $mail->Body = '<p>SMTP is working correctly! ✅</p>';
            $mail->send();
            jsonResponse(['success' => true, 'message' => "Test email sent to $to"]);
        } catch (Throwable $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    // ===== SERVICE CATEGORIES =====
    if ($uri === '/api/service-categories' && $method === 'GET')  return ServiceCategoryController::getAll();
    if ($uri === '/api/service-categories' && $method === 'POST') return ServiceCategoryController::create();
    if (preg_match('#^/api/service-categories/(\d+)$#', $uri, $m)) {
        if ($method === 'PUT')    return ServiceCategoryController::update($m[1]);
        if ($method === 'DELETE') return ServiceCategoryController::delete($m[1]);
    }

    // ===== DOCUMENT FIELD TYPES =====
    if ($uri === '/api/document-field-types' && $method === 'GET')  return DocumentFieldTypeController::getAll();
    if ($uri === '/api/document-field-types' && $method === 'POST') return DocumentFieldTypeController::create();
    if (preg_match('#^/api/document-field-types/(\d+)$#', $uri, $m)) {
        if ($method === 'PUT')    return DocumentFieldTypeController::update($m[1]);
        if ($method === 'DELETE') return DocumentFieldTypeController::delete($m[1]);
    }

    // ===== ASSOCIATES PARTNERS =====
    if ($uri === '/api/partners/register' && $method === 'POST') return PartnerController::register();
    if ($uri === '/api/admin/partners/create' && $method === 'POST') return PartnerController::adminCreate();
    if ($uri === '/api/partners/me' && $method === 'GET')        return PartnerController::getMyProfile();
    if ($uri === '/api/partners/me' && $method === 'PUT')        return PartnerController::updateMyProfile();
    if ($uri === '/api/partners/review-queue' && $method === 'GET') return PartnerController::getMyReviewQueue();
    if ($uri === '/api/partners' && $method === 'GET')           return PartnerController::getAll();
    if (preg_match('#^/api/admin/partners/(\d+)/bulk-rate-cards$#', $uri, $m) && $method === 'POST') {
        return PartnerController::bulkAssignRateCards($m[1]);
    }
    if (preg_match('#^/api/partners/(\d+)/status$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return PartnerController::updateStatus($m[1]);
    }
    if (preg_match('#^/api/partners/(\d+)$#', $uri, $m) && $method === 'GET') {
        return PartnerController::getById($m[1]);
    }

    // ===== RATE CARDS =====
    if ($uri === '/api/rate-cards' && $method === 'GET')  return RateCardController::getAll();
    if ($uri === '/api/rate-cards' && $method === 'POST') return RateCardController::create();
    if (preg_match('#^/api/rate-cards/(\d+)/admin-status$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return RateCardController::adminUpdateStatus($m[1]);
    }
    if (preg_match('#^/api/rate-cards/(\d+)/respond$#', $uri, $m) && in_array($method, ['PUT','PATCH'])) {
        return RateCardController::partnerRespond($m[1]);
    }
    if (preg_match('#^/api/rate-cards/(\d+)$#', $uri, $m)) {
        if ($method === 'GET')    return RateCardController::getById($m[1]);
        if ($method === 'PUT')    return RateCardController::update($m[1]);
        if ($method === 'DELETE') return RateCardController::delete($m[1]);
    }

    // ===== PARTNER SERVICE REQUESTS =====
    if ($uri === '/api/partner/service-requests' && $method === 'POST') return PartnerServiceRequestController::create();
    if ($uri === '/api/partner/service-requests' && $method === 'GET')  return PartnerServiceRequestController::getMy();
    if ($uri === '/api/admin/partner-requests'   && $method === 'GET')  return PartnerServiceRequestController::getAll();
    if (preg_match('#^/api/partner/service-requests/(\d+)$#', $uri, $m) && $method === 'GET') return PartnerServiceRequestController::getById($m[1]);
    if (preg_match('#^/api/admin/partner-requests/(\d+)/status$#', $uri, $m) && in_array($method,['PUT','PATCH'])) return PartnerServiceRequestController::updateStatus($m[1]);
    if (preg_match('#^/api/admin/partner-requests/(\d+)$#', $uri, $m) && $method === 'GET') return PartnerServiceRequestController::getById($m[1]);

    // ===== PERFORMANCE =====
    if ($uri === '/api/performance' && $method === 'GET')            return PerformanceController::getStats();
    if ($uri === '/api/performance/eotm' && $method === 'GET')       return PerformanceController::getEmployeeOfMonth();
    if ($uri === '/api/performance/export/csv' && $method === 'GET') return PerformanceController::exportCSV();
    if ($uri === '/api/performance/export/pdf' && $method === 'GET') return PerformanceController::exportPDF();

    // ===== PAYMENT ACCOUNTS =====
    if ($uri === '/api/admin/payment-accounts' && $method === 'GET')  return PaymentAccountController::getAll();
    if ($uri === '/api/admin/payment-accounts' && $method === 'POST') return PaymentAccountController::create();
    if (preg_match('#^/api/admin/payment-accounts/(\d+)/set-default$#', $uri, $m) && in_array($method, ['PUT','PATCH','POST'])) return PaymentAccountController::setDefault($m[1]);
    if (preg_match('#^/api/admin/payment-accounts/(\d+)$#', $uri, $m)) {
        if ($method === 'PUT')    return PaymentAccountController::update($m[1]);
        if ($method === 'DELETE') return PaymentAccountController::delete($m[1]);
    }

    // ===== PARTNER INVOICES =====
    if ($uri === '/api/partner-invoices' && $method === 'GET')                   return PartnerInvoiceController::getAll();
    if ($uri === '/api/admin/partner-invoices' && $method === 'POST')             return PartnerInvoiceController::create();
    if ($uri === '/api/admin/partner-invoices/auto-generate' && in_array($method,['POST','GET'])) return PartnerInvoiceController::autoGenerate();
    if ($uri === '/api/admin/partner-invoices/export/csv' && $method === 'GET')  return PartnerInvoiceController::exportCSV();
    if (preg_match('#^/api/partner-invoices/(\d+)/pdf$#', $uri, $m) && $method === 'GET')                    return PartnerInvoiceController::generatePDF($m[1]);
    if (preg_match('#^/api/partner-invoices/(\d+)$#', $uri, $m) && $method === 'GET')                        return PartnerInvoiceController::getById($m[1]);
    if (preg_match('#^/api/admin/partner-invoices/(\d+)/review$#', $uri, $m) && in_array($method,['PUT','PATCH'])) return PartnerInvoiceController::review($m[1]);
    if (preg_match('#^/api/admin/partner-invoices/(\d+)/finalize$#', $uri, $m) && in_array($method,['POST','PUT'])) return PartnerInvoiceController::finalize($m[1]);
    if (preg_match('#^/api/admin/partner-invoices/(\d+)/send$#', $uri, $m) && $method === 'POST')             return PartnerInvoiceController::send($m[1]);
    if (preg_match('#^/api/admin/partner-invoices/(\d+)/record-payment$#', $uri, $m) && $method === 'POST')   return PartnerInvoiceController::recordPayment($m[1]);
    if (preg_match('#^/api/admin/partner-invoices/(\d+)/cancel$#', $uri, $m) && in_array($method,['PUT','PATCH','POST'])) return PartnerInvoiceController::cancel($m[1]);

    // 404
    http_response_code(404);
    echo json_encode(['error' => "Not Found - $uri"]);
}
