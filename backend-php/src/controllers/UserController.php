<?php
class UserController {

    // GET /api/users
    public static function getUsers() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $role = $_GET['role'] ?? '';
        $search = $_GET['search'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 20));
        $isActive = $_GET['isActive'] ?? null;
        $offset = ($page - 1) * $limit;

        $where = []; $params = [];
        if ($role) { $where[] = "role = ?"; $params[] = $role; }
        if ($isActive !== null) { $where[] = "is_active = ?"; $params[] = $isActive === 'true' ? 1 : 0; }
        if ($search) {
            $where[] = "(name LIKE ? OR email LIKE ? OR company_name LIKE ?)";
            $like = "%$search%";
            $params = array_merge($params, [$like, $like, $like]);
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $db->prepare("SELECT COUNT(*) FROM users $whereSQL");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $stmt = $db->prepare("SELECT u.*, r.id as role_id, r.name as role_name FROM users u LEFT JOIN roles r ON r.id = u.dynamic_role_id $whereSQL ORDER BY u.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $users = array_map('formatUser', $stmt->fetchAll());

        // Attach avg rating for employees
        if ($role === 'employee') {
            $ratingMap = [];
            $rs = $db->query("SELECT assigned_employee_id, AVG(rating) as avg, COUNT(*) as cnt FROM applications WHERE assigned_employee_id IS NOT NULL AND rating IS NOT NULL GROUP BY assigned_employee_id");
            foreach ($rs->fetchAll() as $row) {
                $ratingMap[(int)$row['assigned_employee_id']] = ['avg' => round((float)$row['avg'], 1), 'cnt' => (int)$row['cnt']];
            }
            $users = array_map(function($u) use ($ratingMap) {
                $uid = (int)($u['id'] ?? $u['_id'] ?? 0);
                $u['avgRating'] = $ratingMap[$uid]['avg'] ?? null;
                $u['ratingCount'] = $ratingMap[$uid]['cnt'] ?? 0;
                return $u;
            }, $users);
        }

        jsonResponse([
            'users' => $users,
            'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)],
        ]);
    }

    // GET /api/users/employees
    public static function getEmployees() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("SELECT u.*, r.id as role_id, r.name as role_name FROM users u LEFT JOIN roles r ON r.id = u.dynamic_role_id WHERE u.role = 'employee' AND u.is_active = 1 ORDER BY u.name");
        $stmt->execute();
        jsonResponse(['employees' => array_map('formatUser', $stmt->fetchAll())]);
    }

    // GET /api/users/:id
    public static function getUserById($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'User not found'], 404);
        jsonResponse(['user' => formatUser($user)]);
    }

    // POST /api/users
    public static function createUser() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $email = strtolower(trim($data['email'] ?? ''));
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) jsonResponse(['error' => 'Email already exists'], 400);

        $hash = password_hash($data['password'] ?? 'password123', PASSWORD_BCRYPT, ['cost' => 12]);
        $roleId = isset($data['roleId']) ? (int)$data['roleId'] : null;
        $joiningDate = !empty($data['joiningDate']) ? $data['joiningDate'] : null;
        $dob = !empty($data['dob']) ? $data['dob'] : null;
        $stmt = $db->prepare("INSERT INTO users (name, email, password, phone, role, department, designation, dynamic_role_id, joining_date, dob, employment_status, is_verified) VALUES (?,?,?,?,?,?,?,?,?,?,'active',1)");
        $stmt->execute([
            $data['name'] ?? '', $email, $hash, $data['phone'] ?? '',
            $data['role'] ?? 'client', $data['department'] ?? null, $data['designation'] ?? null, $roleId,
            $joiningDate, $dob,
        ]);
        $id = (int)$db->lastInsertId();
        // Sync user_roles table
        if ($roleId) {
            $db->prepare("DELETE FROM user_roles WHERE user_id = ?")->execute([$id]);
            $db->prepare("INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?,?,?)")->execute([$id, $roleId, Auth::userId()]);
        }
        $stmt = $db->prepare("SELECT u.*, r.id as role_id, r.name as role_name FROM users u LEFT JOIN roles r ON r.id = u.dynamic_role_id WHERE u.id = ?");
        $stmt->execute([$id]);
        jsonResponse(['user' => formatUser($stmt->fetch())], 201);
    }

    // PUT /api/users/:id
    public static function updateUser($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $fields = []; $params = [];
        foreach (['name' => 'name', 'phone' => 'phone', 'role' => 'role', 'department' => 'department', 'designation' => 'designation'] as $col => $key) {
            if (isset($data[$key])) { $fields[] = "$col = ?"; $params[] = $data[$key]; }
        }
        if (array_key_exists('roleId', $data)) {
            $fields[] = "dynamic_role_id = ?";
            $params[] = $data['roleId'] ? (int)$data['roleId'] : null;
        }
        if (isset($data['isActive'])) { $fields[] = "is_active = ?"; $params[] = $data['isActive'] ? 1 : 0; }
        if (array_key_exists('joiningDate', $data)) { $fields[] = "joining_date = ?"; $params[] = $data['joiningDate'] ?: null; }
        if (array_key_exists('dob', $data)) { $fields[] = "dob = ?"; $params[] = $data['dob'] ?: null; }
        if (array_key_exists('lastWorkingDay', $data)) {
            $fields[] = "last_working_day = ?";
            $params[] = $data['lastWorkingDay'] ?: null;
        }
        if (array_key_exists('employmentStatus', $data)) {
            $status = $data['employmentStatus'];
            $fields[] = "employment_status = ?";
            $params[] = $status;
            // If resigned/terminated and last working day passed, deactivate
            if (in_array($status, ['resigned', 'terminated'])) {
                $lwd = $data['lastWorkingDay'] ?? null;
                if (!$lwd) {
                    // Fetch existing last_working_day
                    $lwdRow = $db->prepare("SELECT last_working_day FROM users WHERE id = ?");
                    $lwdRow->execute([$id]);
                    $lwd = $lwdRow->fetchColumn();
                }
                if ($lwd && strtotime($lwd) < strtotime('today')) {
                    $fields[] = "is_active = ?";
                    $params[] = 0;
                }
            }
        }

        if (!$fields) jsonResponse(['error' => 'No fields to update'], 400);
        $params[] = $id;
        $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

        // Sync user_roles table if roleId was updated
        if (array_key_exists('roleId', $data)) {
            $db->prepare("DELETE FROM user_roles WHERE user_id = ?")->execute([$id]);
            if ($data['roleId']) {
                $db->prepare("INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?,?,?)")->execute([$id, (int)$data['roleId'], Auth::userId()]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'User not found'], 404);
        jsonResponse(['user' => formatUser($user)]);
    }

    // DELETE /api/users/:id (soft delete)
    public static function deleteUser($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonResponse(['error' => 'User not found'], 404);
        jsonResponse(['message' => 'User deactivated successfully']);
    }

    // POST /api/admin/birthday-check  — send birthday emails, create notifications
    public static function runBirthdayCheck() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();

        // Find employees with birthday today
        $stmt = $db->prepare("SELECT id, name, email FROM users WHERE role = 'employee' AND is_active = 1 AND dob IS NOT NULL AND MONTH(dob) = MONTH(CURDATE()) AND DAY(dob) = DAY(CURDATE())");
        $stmt->execute([]);
        $employees = $stmt->fetchAll();

        if (empty($employees)) {
            jsonResponse(['message' => 'No birthdays today', 'count' => 0]);
        }

        // Get all admins
        $admins = $db->query("SELECT id, name, email FROM users WHERE role = 'admin' AND is_active = 1")->fetchAll();

        $notified = [];
        foreach ($employees as $emp) {
            // Check if already notified today
            $check = $db->prepare("SELECT id FROM notifications WHERE user_id = ? AND type = 'birthday' AND DATE(created_at) = CURDATE()");
            $check->execute([$emp['id']]);
            if ($check->fetch()) continue; // already sent today

            // Notify the employee
            $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'birthday', '/employee')")
               ->execute([$emp['id'], '🎂 Happy Birthday!', 'Wishing you a wonderful birthday from the entire Tax CareerXera family! 🎉']);

            // Send birthday email to employee
            try { Mailer::sendBirthdayEmail($emp['email'], $emp['name']); } catch (Throwable $e) {}

            // Notify admins
            foreach ($admins as $admin) {
                $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'birthday', '/admin/employees')")
                   ->execute([$admin['id'], "🎂 Birthday: {$emp['name']}", "{$emp['name']} is celebrating their birthday today!"]);
                try { Mailer::sendBirthdayAdminEmail($admin['email'], $admin['name'], $emp['name'], $emp['email']); } catch (Throwable $e) {}
            }

            $notified[] = $emp['name'];
        }

        jsonResponse(['message' => 'Birthday check complete', 'notified' => $notified, 'count' => count($notified)]);
    }

    // GET /api/admin/birthday-today — check if any birthday today (lightweight, for dashboard badge)
    public static function getBirthdaysToday() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("SELECT id, name, email, dob FROM users WHERE role = 'employee' AND is_active = 1 AND dob IS NOT NULL AND MONTH(dob) = MONTH(CURDATE()) AND DAY(dob) = DAY(CURDATE())");
        $stmt->execute([]);
        $employees = $stmt->fetchAll();
        jsonResponse(['employees' => array_map(fn($e) => ['id' => $e['id'], 'name' => $e['name'], 'email' => $e['email'], 'dob' => $e['dob']], $employees)]);
    }

    // GET /api/employee/profile — employee reads own joining date + dob
    public static function getMyProfile() {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT u.*, r.id as role_id, r.name as role_name FROM users u LEFT JOIN roles r ON r.id = u.dynamic_role_id WHERE u.id = ?");
        $stmt->execute([Auth::userId()]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'User not found'], 404);
        jsonResponse(['user' => formatUser($user)]);
    }

    // GET /api/users/online-status?ids=1,2,3 (or returns all)
    public static function getOnlineStatus() {
        Auth::protect();
        $db = getDb();
        $ids = !empty($_GET['ids']) ? array_map('intval', explode(',', $_GET['ids'])) : [];
        if (empty($ids)) {
            // Return all active users' last_active_at
            try {
                $stmt = $db->query("SELECT id, role, last_active_at FROM users WHERE is_active = 1");
            } catch (\Throwable $e) {
                jsonResponse(['status' => []]);
                return;
            }
        } else {
            $ph = implode(',', array_fill(0, count($ids), '?'));
            try {
                $stmt = $db->prepare("SELECT id, role, last_active_at FROM users WHERE id IN ($ph)");
                $stmt->execute($ids);
            } catch (\Throwable $e) {
                jsonResponse(['status' => []]);
                return;
            }
        }
        $rows = $stmt->fetchAll();
        $now = time();
        $status = array_map(fn($r) => [
            'id'           => (int)$r['id'],
            'role'         => $r['role'],
            'lastActiveAt' => $r['last_active_at'],
            'isOnline'     => $r['last_active_at'] && ($now - strtotime($r['last_active_at'])) < 300, // 5 min
        ], $rows);
        jsonResponse(['status' => $status]);
    }
}
