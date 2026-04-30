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
    if ($uri === '/api/tasks/my' && $method === 'GET') return TaskController::getMyTasks();
    if (preg_match('#^/api/tasks/(\d+)/status$#', $uri, $m) && in_array($method, ['PUT', 'PATCH'])) {
        return TaskController::updateTaskStatus($m[1]);
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

    // 404
    http_response_code(404);
    echo json_encode(['error' => "Not Found - $uri"]);
}
