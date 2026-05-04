<?php
class PerformanceController {

    // GET /api/performance?startDate=&endDate=&employeeId=
    public static function getStats() {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();

        $startDate  = $_GET['startDate']  ?? null;
        $endDate    = $_GET['endDate']    ?? null;
        $employeeId = isset($_GET['employeeId']) ? (int)$_GET['employeeId'] : null;

        // If employee role, only see self
        if ($user['role'] === 'employee') $employeeId = $user['id'];

        $taskDateFilter = '';
        $appDateFilter  = '';
        $dateParams     = [];
        if ($startDate && $endDate) {
            $taskDateFilter = "AND (t.created_at >= ? AND t.created_at <= ?)";
            $appDateFilter  = "AND (a.created_at >= ? AND a.created_at <= ?)";
            $dateParams = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];
        }

        $empFilter = $employeeId ? "AND u.id = ?" : "";
        $empParams = $employeeId ? [$employeeId] : [];

        $sql = "
            SELECT
                u.id, u.name, u.email, u.department, u.designation, u.profile_photo,
                COUNT(DISTINCT t.id)                                                                 AS total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)                      AS completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status IN ('pending','in-progress') THEN t.id END)       AS pending_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'completed' AND t.due_date IS NOT NULL AND t.completed_at IS NOT NULL AND t.completed_at <= t.due_date THEN t.id END) AS on_time_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'completed' AND t.due_date IS NOT NULL AND t.completed_at IS NOT NULL AND t.completed_at > t.due_date THEN t.id END) AS delayed_tasks,
                COALESCE(SUM(CASE WHEN a_paid.payment_status = 'paid' THEN a_paid.payment_total ELSE 0 END), 0) AS revenue,
                COUNT(DISTINCT a_all.id)                                                             AS applications_handled
            FROM users u
            LEFT JOIN tasks t ON t.assigned_to = u.id $taskDateFilter
            LEFT JOIN applications a_all ON a_all.assigned_employee_id = u.id $appDateFilter
            LEFT JOIN applications a_paid ON a_paid.assigned_employee_id = u.id AND a_paid.payment_status = 'paid' $appDateFilter
            WHERE u.role = 'employee' AND u.is_active = 1 $empFilter
            GROUP BY u.id
            ORDER BY completed_tasks DESC, revenue DESC
        ";

        $params = array_merge($dateParams, $dateParams, $dateParams, $empParams);
        $stmt = $db->prepare($sql); $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $employees = [];
        foreach ($rows as $i => $r) {
            $completed   = (int)$r['completed_tasks'];
            $onTime      = (int)$r['on_time_tasks'];
            $onTimePct   = $completed > 0 ? round($onTime / $completed * 100, 1) : 0;
            $revenue     = (float)$r['revenue'];
            $score       = round($completed * 0.4 + ($revenue / 1000) * 0.3 + $onTimePct * 0.3, 2);
            $employees[] = [
                'rank'                => $i + 1,
                'id'                  => (int)$r['id'],
                'name'                => $r['name'],
                'email'               => $r['email'],
                'department'          => $r['department'] ?? '',
                'designation'         => $r['designation'] ?? '',
                'profilePhoto'        => $r['profile_photo'] ?? null,
                'totalTasks'          => (int)$r['total_tasks'],
                'completedTasks'      => $completed,
                'pendingTasks'        => (int)$r['pending_tasks'],
                'onTimeTasks'         => $onTime,
                'delayedTasks'        => (int)$r['delayed_tasks'],
                'onTimePercent'       => $onTimePct,
                'revenue'             => $revenue,
                'applicationsHandled' => (int)$r['applications_handled'],
                'score'               => $score,
            ];
        }

        // Re-sort by score (already approximately sorted but re-sort to be safe)
        usort($employees, fn($a, $b) => $b['score'] <=> $a['score']);
        foreach ($employees as $i => &$e) $e['rank'] = $i + 1;
        unset($e);

        $eotm = count($employees) > 0 ? $employees[0] : null;

        // Monthly trend (last 6 months) — tasks completed per employee per month
        $trendSql = "
            SELECT u.id AS employee_id, DATE_FORMAT(t.completed_at, '%Y-%m') AS month,
                   COUNT(t.id) AS completed
            FROM tasks t
            JOIN users u ON u.id = t.assigned_to
            WHERE t.status = 'completed' AND t.completed_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
              AND u.role = 'employee' AND u.is_active = 1
            GROUP BY u.id, month
            ORDER BY month ASC
        ";
        $trendStmt = $db->query($trendSql); $trendRows = $trendStmt->fetchAll();

        // Revenue trend — per month
        $revTrendSql = "
            SELECT DATE_FORMAT(a.updated_at, '%Y-%m') AS month, SUM(a.payment_total) AS revenue
            FROM applications a
            WHERE a.payment_status = 'paid' AND a.updated_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month ORDER BY month ASC
        ";
        $revTrendStmt = $db->query($revTrendSql); $revTrend = $revTrendStmt->fetchAll();

        jsonResponse([
            'employees'    => $employees,
            'eotm'         => $eotm,
            'taskTrend'    => $trendRows,
            'revenueTrend' => array_map(fn($r) => ['month' => $r['month'], 'revenue' => (float)$r['revenue']], $revTrend),
        ]);
    }

    // GET /api/performance/eotm
    public static function getEmployeeOfMonth() {
        Auth::protect();
        $db = getDb();

        // Current month
        $sql = "
            SELECT u.id, u.name, u.email, u.department, u.designation, u.profile_photo,
                COUNT(DISTINCT CASE WHEN t.status='completed' THEN t.id END) AS completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status='completed' AND t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at <= t.due_date THEN t.id END) AS on_time_tasks,
                COALESCE(SUM(CASE WHEN a.payment_status='paid' THEN a.payment_total ELSE 0 END),0) AS revenue
            FROM users u
            LEFT JOIN tasks t ON t.assigned_to = u.id AND t.completed_at IS NOT NULL AND MONTH(t.completed_at) = MONTH(NOW()) AND YEAR(t.completed_at) = YEAR(NOW())
            LEFT JOIN applications a ON a.assigned_employee_id = u.id AND a.payment_status='paid' AND MONTH(a.updated_at) = MONTH(NOW()) AND YEAR(a.updated_at) = YEAR(NOW())
            WHERE u.role='employee' AND u.is_active=1
            GROUP BY u.id
        ";
        $rows = $db->query($sql)->fetchAll();
        if (!$rows) { jsonResponse(['eotm' => null]); return; }

        $best = null; $bestScore = -1;
        foreach ($rows as $r) {
            $c = (int)$r['completed_tasks']; $o = (int)$r['on_time_tasks']; $rev = (float)$r['revenue'];
            $pct   = $c > 0 ? $o / $c * 100 : 0;
            $score = $c * 0.4 + ($rev / 1000) * 0.3 + $pct * 0.3;
            if ($score > $bestScore) { $bestScore = $score; $best = $r; $best['score'] = round($score,2); $best['onTimePercent'] = round($pct,1); }
        }
        jsonResponse(['eotm' => $best]);
    }

    // GET /api/performance/export/csv
    public static function exportCSV() {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();

        $startDate = $_GET['startDate'] ?? null;
        $endDate   = $_GET['endDate']   ?? null;

        $taskDateFilter = ''; $appDateFilter = ''; $dateParams = [];
        if ($startDate && $endDate) {
            $taskDateFilter = "AND (t.created_at >= ? AND t.created_at <= ?)";
            $appDateFilter  = "AND (a.created_at >= ? AND a.created_at <= ?)";
            $dateParams = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];
        }

        $sql = "
            SELECT u.name, u.email, u.department, u.designation,
                COUNT(DISTINCT t.id) AS total_tasks,
                COUNT(DISTINCT CASE WHEN t.status='completed' THEN t.id END) AS completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status IN ('pending','in-progress') THEN t.id END) AS pending_tasks,
                COUNT(DISTINCT CASE WHEN t.status='completed' AND t.due_date IS NOT NULL AND t.completed_at IS NOT NULL AND t.completed_at<=t.due_date THEN t.id END) AS on_time_tasks,
                COALESCE(SUM(CASE WHEN a_paid.payment_status='paid' THEN a_paid.payment_total ELSE 0 END),0) AS revenue
            FROM users u
            LEFT JOIN tasks t ON t.assigned_to = u.id $taskDateFilter
            LEFT JOIN applications a_paid ON a_paid.assigned_employee_id = u.id AND a_paid.payment_status='paid' $appDateFilter
            WHERE u.role='employee' AND u.is_active=1
            GROUP BY u.id ORDER BY completed_tasks DESC
        ";
        $stmt = $db->prepare($sql); $stmt->execute(array_merge($dateParams, $dateParams));
        $rows = $stmt->fetchAll();

        $filename = 'performance_' . date('Ymd') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache'); header('Expires: 0');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['Name','Email','Department','Designation','Total Tasks','Completed','Pending','On-Time','Delayed','On-Time %','Revenue (₹)','Score']);
        foreach ($rows as $r) {
            $c = (int)$r['completed_tasks']; $o = (int)$r['on_time_tasks'];
            $pct = $c > 0 ? round($o / $c * 100, 1) : 0;
            $rev = (float)$r['revenue'];
            $score = round($c * 0.4 + ($rev/1000)*0.3 + $pct*0.3, 2);
            $delayed = $c - $o;
            fputcsv($out, [
                $r['name'], $r['email'], $r['department'] ?? '', $r['designation'] ?? '',
                $r['total_tasks'], $c, $r['pending_tasks'], $o, max(0,$delayed),
                $pct, $rev, $score
            ]);
        }
        fclose($out);
        exit;
    }

    // GET /api/performance/export/pdf
    public static function exportPDF() {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();

        $startDate = $_GET['startDate'] ?? null;
        $endDate   = $_GET['endDate']   ?? null;

        $taskDateFilter = ''; $appDateFilter = ''; $dateParams = [];
        if ($startDate && $endDate) {
            $taskDateFilter = "AND (t.created_at >= ? AND t.created_at <= ?)";
            $appDateFilter  = "AND (a.created_at >= ? AND a.created_at <= ?)";
            $dateParams = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];
        }

        $sql = "
            SELECT u.name, u.email, u.department, u.designation,
                COUNT(DISTINCT t.id) AS total_tasks,
                COUNT(DISTINCT CASE WHEN t.status='completed' THEN t.id END) AS completed_tasks,
                COUNT(DISTINCT CASE WHEN t.status IN ('pending','in-progress') THEN t.id END) AS pending_tasks,
                COUNT(DISTINCT CASE WHEN t.status='completed' AND t.due_date IS NOT NULL AND t.completed_at IS NOT NULL AND t.completed_at<=t.due_date THEN t.id END) AS on_time_tasks,
                COALESCE(SUM(CASE WHEN a_paid.payment_status='paid' THEN a_paid.payment_total ELSE 0 END),0) AS revenue
            FROM users u
            LEFT JOIN tasks t ON t.assigned_to = u.id $taskDateFilter
            LEFT JOIN applications a_paid ON a_paid.assigned_employee_id = u.id AND a_paid.payment_status='paid' $appDateFilter
            WHERE u.role='employee' AND u.is_active=1
            GROUP BY u.id ORDER BY completed_tasks DESC
        ";
        $stmt = $db->prepare($sql); $stmt->execute(array_merge($dateParams, $dateParams));
        $rows = $stmt->fetchAll();

        $dateRange = ($startDate && $endDate) ? "$startDate to $endDate" : 'All Time';
        $rows_html = '';
        $rank = 1;
        foreach ($rows as $r) {
            $c = (int)$r['completed_tasks']; $o = (int)$r['on_time_tasks'];
            $pct = $c > 0 ? round($o / $c * 100, 1) : 0;
            $rev = number_format((float)$r['revenue'], 2);
            $score = round($c * 0.4 + ((float)$r['revenue']/1000)*0.3 + $pct*0.3, 2);
            $delayed = max(0, $c - $o);
            $rows_html .= "<tr>
                <td>$rank</td>
                <td>" . htmlspecialchars($r['name']) . "</td>
                <td>" . htmlspecialchars($r['department'] ?? '-') . "</td>
                <td>{$r['total_tasks']}</td>
                <td>$c</td>
                <td>{$r['pending_tasks']}</td>
                <td>$o / $delayed</td>
                <td>$pct%</td>
                <td>₹$rev</td>
                <td>$score</td>
            </tr>";
            $rank++;
        }

        $html = "<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>Performance Report</title>
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size:12px; color:#1a1a1a; }
  h1 { color:#1e3a5f; font-size:20px; } h3 { color:#555; font-size:13px; margin:0; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  th { background:#1e3a5f; color:#fff; padding:8px 6px; text-align:left; font-size:11px; }
  td { padding:7px 6px; border-bottom:1px solid #e5e7eb; font-size:11px; }
  tr:nth-child(even) td { background:#f9fafb; }
  .footer { margin-top:20px; color:#999; font-size:10px; }
</style></head>
<body>
  <h1>Employee Performance Report</h1>
  <h3>Period: $dateRange</h3>
  <h3>Generated: " . date('d M Y H:i') . "</h3>
  <table>
    <thead><tr>
      <th>#</th><th>Name</th><th>Dept</th><th>Total</th><th>Done</th>
      <th>Pending</th><th>On-Time/Late</th><th>On-Time%</th><th>Revenue</th><th>Score</th>
    </tr></thead>
    <tbody>$rows_html</tbody>
  </table>
  <p class='footer'>Generated by CareerXera Tax Platform</p>
</body></html>";

        require_once __DIR__ . '/../../vendor/autoload.php';
        $options = new \Dompdf\Options(); $options->set('defaultFont','DejaVu Sans');
        $dompdf  = new \Dompdf\Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4','landscape');
        $dompdf->render();

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="performance_' . date('Ymd') . '.pdf"');
        echo $dompdf->output();
        exit;
    }
}
