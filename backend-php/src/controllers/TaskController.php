<?php
class TaskController {

    private static function formatTask($t, $db) {
        if (!$t) return null;
        $id = (int)$t['id'];

        // Application
        $app = null;
        if ($t['application_id']) {
            $s = $db->prepare("SELECT a.*, u.name as client_name, u.email as client_email, u.phone as client_phone, sv.name as service_name, sv.category as service_category FROM applications a LEFT JOIN users u ON a.client_id = u.id LEFT JOIN services sv ON a.service_id = sv.id WHERE a.id = ?");
            $s->execute([$t['application_id']]);
            $appRow = $s->fetch();
            if ($appRow) {
                $app = [
                    '_id' => (string)$appRow['id'], 'applicationId' => $appRow['application_id'], 'status' => $appRow['status'],
                    'client' => ['_id' => (string)$appRow['client_id'], 'name' => $appRow['client_name'], 'email' => $appRow['client_email'], 'phone' => $appRow['client_phone']],
                    'service' => ['name' => $appRow['service_name'], 'category' => $appRow['service_category']],
                ];
            }
        }

        // Assigned to/by
        $assignedTo = null; $assignedBy = null;
        if ($t['assigned_to']) { $s = $db->prepare("SELECT * FROM users WHERE id = ?"); $s->execute([$t['assigned_to']]); $assignedTo = formatUser($s->fetch()); }
        if ($t['assigned_by']) { $s = $db->prepare("SELECT * FROM users WHERE id = ?"); $s->execute([$t['assigned_by']]); $assignedBy = formatUser($s->fetch()); }

        // Remarks
        $s = $db->prepare("SELECT r.*, u.name as author_name FROM task_remarks r LEFT JOIN users u ON r.author_id = u.id WHERE r.task_id = ? ORDER BY r.created_at");
        $s->execute([$id]);
        $remarks = array_map(fn($r) => [
            'text' => $r['text'], 'author' => ['_id' => (string)$r['author_id'], 'name' => $r['author_name']], 'createdAt' => $r['created_at'],
        ], $s->fetchAll());

        return [
            'id' => $id, '_id' => (string)$id,
            'application' => $app, 'assignedTo' => $assignedTo, 'assignedBy' => $assignedBy,
            'title' => $t['title'], 'description' => $t['description'],
            'status' => $t['status'], 'priority' => $t['priority'],
            'dueDate' => $t['due_date'], 'completedAt' => $t['completed_at'],
            'remarks' => $remarks,
            'createdAt' => $t['created_at'], 'updatedAt' => $t['updated_at'],
        ];
    }

    // GET /api/tasks
    public static function getTasks() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $status = $_GET['status'] ?? ''; $priority = $_GET['priority'] ?? '';
        $assignedTo = $_GET['assignedTo'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1)); $limit = max(1, (int)($_GET['limit'] ?? 20));

        $where = []; $params = [];
        if ($status) { $where[] = "status = ?"; $params[] = $status; }
        if ($priority) { $where[] = "priority = ?"; $params[] = $priority; }
        if ($assignedTo) { $where[] = "assigned_to = ?"; $params[] = $assignedTo; }
        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $total = (int)$db->prepare("SELECT COUNT(*) FROM tasks $whereSQL")->execute($params) ? $db->prepare("SELECT COUNT(*) FROM tasks $whereSQL") : null;
        $stmt = $db->prepare("SELECT COUNT(*) FROM tasks $whereSQL"); $stmt->execute($params); $total = (int)$stmt->fetchColumn();

        $offset = ($page - 1) * $limit;
        $stmt = $db->prepare("SELECT * FROM tasks $whereSQL ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $tasks = array_map(fn($t) => self::formatTask($t, $db), $stmt->fetchAll());

        jsonResponse(['tasks' => $tasks, 'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)]]);
    }

    // GET /api/tasks/my
    public static function getMyTasks() {
        Auth::protect(); Auth::authorize('employee');
        $db = getDb();
        $status = $_GET['status'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1)); $limit = max(1, (int)($_GET['limit'] ?? 20));

        $where = ["assigned_to = ?"]; $params = [Auth::userId()];
        if ($status) { $where[] = "status = ?"; $params[] = $status; }
        $whereSQL = 'WHERE ' . implode(' AND ', $where);

        $stmt = $db->prepare("SELECT COUNT(*) FROM tasks $whereSQL"); $stmt->execute($params); $total = (int)$stmt->fetchColumn();
        $offset = ($page - 1) * $limit;
        $stmt = $db->prepare("SELECT * FROM tasks $whereSQL ORDER BY FIELD(priority,'urgent','high','medium','low'), created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $tasks = array_map(fn($t) => self::formatTask($t, $db), $stmt->fetchAll());

        jsonResponse(['tasks' => $tasks, 'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)]]);
    }

    // GET /api/tasks/:id
    public static function getTaskById($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $t = $stmt->fetch();
        if (!$t) jsonResponse(['error' => 'Task not found'], 404);
        jsonResponse(['task' => self::formatTask($t, $db)]);
    }

    // POST /api/tasks
    public static function createTask() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $stmt = $db->prepare("INSERT INTO tasks (application_id, assigned_to, assigned_by, title, description, status, priority, due_date) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $data['application'] ?? null, $data['assignedTo'] ?? null, Auth::userId(),
            $data['title'] ?? '', $data['description'] ?? '',
            $data['status'] ?? 'pending', $data['priority'] ?? 'medium', $data['dueDate'] ?? null,
        ]);
        $id = (int)$db->lastInsertId();

        // Notify
        $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'New Task', ?, 'task', ?)")
           ->execute([$data['assignedTo'], "New task: " . ($data['title'] ?? ''), "/employee/tasks/$id"]);

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        jsonResponse(['task' => self::formatTask($stmt->fetch(), $db)], 201);
    }

    // PUT /api/tasks/:id
    public static function updateTask($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $data = getJsonInput();
        $db = getDb();

        $fields = []; $params = [];
        foreach (['title' => 'title', 'description' => 'description', 'status' => 'status', 'priority' => 'priority'] as $col => $key) {
            if (isset($data[$key])) { $fields[] = "$col = ?"; $params[] = $data[$key]; }
        }
        if (isset($data['assignedTo'])) { $fields[] = "assigned_to = ?"; $params[] = $data['assignedTo']; }
        if (isset($data['dueDate'])) { $fields[] = "due_date = ?"; $params[] = $data['dueDate']; }

        if ($fields) { $params[] = $id; $db->prepare("UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params); }

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $t = $stmt->fetch();
        if (!$t) jsonResponse(['error' => 'Task not found'], 404);
        jsonResponse(['task' => self::formatTask($t, $db)]);
    }

    // PUT|PATCH /api/tasks/:id/status
    public static function updateTaskStatus($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $data = getJsonInput();
        $db = getDb();
        $status = $data['status'] ?? '';
        $remarks = $data['remarks'] ?? '';

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $t = $stmt->fetch();
        if (!$t) jsonResponse(['error' => 'Task not found'], 404);

        $extra = $status === 'completed' ? ", completed_at = NOW()" : "";
        $db->prepare("UPDATE tasks SET status = ?$extra WHERE id = ?")->execute([$status, $id]);

        if ($remarks) {
            $db->prepare("INSERT INTO task_remarks (task_id, text, author_id) VALUES (?,?,?)")
               ->execute([$id, $remarks, Auth::userId()]);
        }

        // Notify admins
        $admins = $db->query("SELECT id FROM users WHERE role = 'admin' AND is_active = 1")->fetchAll();
        foreach ($admins as $admin) {
            $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'Task Update', ?, 'task', ?)")
               ->execute([$admin['id'], "Task \"{$t['title']}\" status changed to $status", "/admin/tasks/$id"]);
        }

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        jsonResponse(['task' => self::formatTask($stmt->fetch(), $db)]);
    }
}
