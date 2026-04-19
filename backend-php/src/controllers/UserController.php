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

        $stmt = $db->prepare("SELECT * FROM users $whereSQL ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $users = array_map('formatUser', $stmt->fetchAll());

        jsonResponse([
            'users' => $users,
            'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)],
        ]);
    }

    // GET /api/users/employees
    public static function getEmployees() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM users WHERE role = 'employee' AND is_active = 1 ORDER BY name");
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
        $stmt = $db->prepare("INSERT INTO users (name, email, password, phone, role, department, designation, is_verified) VALUES (?,?,?,?,?,?,?,1)");
        $stmt->execute([
            $data['name'] ?? '', $email, $hash, $data['phone'] ?? '',
            $data['role'] ?? 'client', $data['department'] ?? null, $data['designation'] ?? null,
        ]);
        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
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
        if (isset($data['isActive'])) { $fields[] = "is_active = ?"; $params[] = $data['isActive'] ? 1 : 0; }

        if (!$fields) jsonResponse(['error' => 'No fields to update'], 400);
        $params[] = $id;
        $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

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
}
