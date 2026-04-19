<?php
class DashboardController {

    // GET /api/dashboard/admin
    public static function getAdminDashboard() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();

        $totalClients = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'client' AND is_active = 1")->fetchColumn();
        $totalEmployees = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'employee' AND is_active = 1")->fetchColumn();
        $totalApplications = (int)$db->query("SELECT COUNT(*) FROM applications")->fetchColumn();
        $pendingApplications = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status IN ('submitted','under-review')")->fetchColumn();
        $inProgressApplications = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status = 'in-progress'")->fetchColumn();
        $completedApplications = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status = 'completed'")->fetchColumn();
        $totalRevenue = (float)($db->query("SELECT COALESCE(SUM(payment_total), 0) FROM applications WHERE payment_status = 'paid'")->fetchColumn());

        // Recent applications
        $stmt = $db->query("SELECT a.*, u.name as client_name, u.email as client_email, s.name as service_name FROM applications a LEFT JOIN users u ON a.client_id = u.id LEFT JOIN services s ON a.service_id = s.id ORDER BY a.created_at DESC LIMIT 10");
        $recentApplications = array_map(fn($a) => [
            '_id' => (string)$a['id'], 'applicationId' => $a['application_id'], 'status' => $a['status'],
            'client' => ['_id' => (string)$a['client_id'], 'name' => $a['client_name'], 'email' => $a['client_email']],
            'service' => ['name' => $a['service_name']],
            'createdAt' => $a['created_at'],
        ], $stmt->fetchAll());

        // Recent activity
        $stmt = $db->query("SELECT al.*, u.name as user_name, u.role as user_role FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 20");
        $recentActivity = array_map(fn($a) => [
            '_id' => (string)$a['id'], 'action' => $a['action'], 'entity' => $a['entity'],
            'user' => ['_id' => (string)$a['user_id'], 'name' => $a['user_name'], 'role' => $a['user_role']],
            'createdAt' => $a['created_at'],
        ], $stmt->fetchAll());

        // Monthly stats
        $stmt = $db->query("SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN payment_total ELSE 0 END), 0) as revenue FROM applications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY year, month");
        $monthlyStats = array_map(fn($m) => [
            '_id' => ['year' => (int)$m['year'], 'month' => (int)$m['month']],
            'count' => (int)$m['count'], 'revenue' => (float)$m['revenue'],
        ], $stmt->fetchAll());

        // Status distribution
        $stmt = $db->query("SELECT status as _id, COUNT(*) as count FROM applications GROUP BY status");
        $statusDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Service popularity
        $stmt = $db->query("SELECT s.name, COUNT(*) as count FROM applications a JOIN services s ON a.service_id = s.id GROUP BY a.service_id, s.name ORDER BY count DESC LIMIT 10");
        $serviceStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'stats' => compact('totalClients', 'totalEmployees', 'totalApplications', 'pendingApplications', 'inProgressApplications', 'completedApplications', 'totalRevenue'),
            'monthlyStats' => $monthlyStats,
            'statusDistribution' => $statusDistribution,
            'serviceStats' => $serviceStats,
            'recentApplications' => $recentApplications,
            'recentActivity' => $recentActivity,
        ]);
    }

    // GET /api/dashboard/employee
    public static function getEmployeeDashboard() {
        Auth::protect(); Auth::authorize('employee');
        $db = getDb();
        $uid = Auth::userId();

        $totalTasks = (int)$db->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to = ?")->execute([$uid]) ? 0 : 0;
        $s = $db->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to = ?"); $s->execute([$uid]); $totalTasks = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND status = 'pending'"); $s->execute([$uid]); $pendingTasks = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND status = 'in-progress'"); $s->execute([$uid]); $inProgressTasks = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND status = 'completed'"); $s->execute([$uid]); $completedTasks = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM applications WHERE assigned_employee_id = ?"); $s->execute([$uid]); $assignedApplications = (int)$s->fetchColumn();

        $s = $db->prepare("SELECT t.*, a.application_id as app_id_str FROM tasks t LEFT JOIN applications a ON t.application_id = a.id WHERE t.assigned_to = ? ORDER BY t.created_at DESC LIMIT 10");
        $s->execute([$uid]);
        $recentTasks = array_map(fn($t) => [
            '_id' => (string)$t['id'], 'title' => $t['title'], 'status' => $t['status'], 'priority' => $t['priority'],
            'application' => ['applicationId' => $t['app_id_str']],
            'createdAt' => $t['created_at'],
        ], $s->fetchAll());

        jsonResponse([
            'stats' => compact('totalTasks', 'pendingTasks', 'inProgressTasks', 'completedTasks', 'assignedApplications'),
            'recentTasks' => $recentTasks,
        ]);
    }

    // GET /api/dashboard/client
    public static function getClientDashboard() {
        Auth::protect();
        $db = getDb();
        $uid = Auth::userId();

        $s = $db->prepare("SELECT COUNT(*) FROM applications WHERE client_id = ?"); $s->execute([$uid]); $totalApplications = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM applications WHERE client_id = ? AND status IN ('submitted','under-review','in-progress')"); $s->execute([$uid]); $activeApplications = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM applications WHERE client_id = ? AND status = 'completed'"); $s->execute([$uid]); $completedApplications = (int)$s->fetchColumn();
        $s = $db->prepare("SELECT COUNT(*) FROM applications WHERE client_id = ? AND payment_status = 'pending'"); $s->execute([$uid]); $pendingPayments = (int)$s->fetchColumn();

        $s = $db->prepare("SELECT a.*, s.name as service_name, s.slug as service_slug, s.icon as service_icon FROM applications a LEFT JOIN services s ON a.service_id = s.id WHERE a.client_id = ? ORDER BY a.created_at DESC LIMIT 5");
        $s->execute([$uid]);
        $recentApplications = array_map(fn($a) => [
            '_id' => (string)$a['id'], 'applicationId' => $a['application_id'], 'status' => $a['status'],
            'service' => ['name' => $a['service_name'], 'slug' => $a['service_slug'], 'icon' => $a['service_icon']],
            'createdAt' => $a['created_at'],
        ], $s->fetchAll());

        jsonResponse([
            'stats' => compact('totalApplications', 'activeApplications', 'completedApplications', 'pendingPayments'),
            'recentApplications' => $recentApplications,
        ]);
    }

    // GET /api/dashboard/reports
    public static function getReports() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $year = (int)($_GET['year'] ?? date('Y'));
        $period = $_GET['period'] ?? 'monthly';

        $s = $db->prepare("SELECT MONTH(created_at) as month, COALESCE(SUM(payment_total), 0) as revenue, COUNT(*) as count FROM applications WHERE YEAR(created_at) = ? AND payment_status = 'paid' GROUP BY MONTH(created_at) ORDER BY month");
        $s->execute([$year]);
        $revenueReport = array_map(fn($r) => [
            '_id' => ['month' => (int)$r['month']], 'revenue' => (float)$r['revenue'], 'count' => (int)$r['count'],
        ], $s->fetchAll());

        $s = $db->prepare("SELECT s.name, COUNT(*) as count, COALESCE(SUM(a.payment_total), 0) as revenue FROM applications a JOIN services s ON a.service_id = s.id WHERE YEAR(a.created_at) = ? GROUP BY a.service_id, s.name ORDER BY count DESC");
        $s->execute([$year]);
        $serviceReport = $s->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(['revenueReport' => $revenueReport, 'serviceReport' => $serviceReport, 'year' => $year]);
    }
}
