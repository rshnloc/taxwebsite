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

        // Final documents
        $fdStmt = $db->prepare("SELECT tfd.*, u.name as uploader_name FROM task_final_documents tfd LEFT JOIN users u ON tfd.uploaded_by = u.id WHERE tfd.task_id = ? ORDER BY tfd.uploaded_at DESC");
        $fdStmt->execute([$id]);
        $finalDocs = array_map(fn($d) => [
            'id' => (int)$d['id'], 'name' => $d['name'], 'docType' => $d['doc_type'],
            'description' => $d['description'], 'originalName' => $d['original_name'],
            'path' => $d['path'], 'mimeType' => $d['mime_type'], 'size' => (int)$d['size'],
            'uploadedBy' => $d['uploader_name'], 'uploadedAt' => $d['uploaded_at'],
            'hasPassword' => !empty($d['password']),
        ], $fdStmt->fetchAll());

        return [
            'id' => $id, '_id' => (string)$id,
            'application' => $app, 'assignedTo' => $assignedTo, 'assignedBy' => $assignedBy,
            'title' => $t['title'], 'description' => $t['description'],
            'status' => $t['status'], 'priority' => $t['priority'],
            'dueDate' => $t['due_date'], 'completedAt' => $t['completed_at'],
            'remarks' => $remarks,
            'finalDocs' => $finalDocs,
            'finalDocsCount' => count($finalDocs),
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

        // In-app notification
        $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'New Task', ?, 'task', ?)")
           ->execute([$data['assignedTo'], "New task: " . ($data['title'] ?? ''), "/employee/tasks/$id"]);

        // Email to assignee
        if (!empty($data['assignedTo'])) {
            try {
                $assigneeStmt = $db->prepare("SELECT name, email FROM users WHERE id = ?");
                $assigneeStmt->execute([$data['assignedTo']]);
                $assignee = $assigneeStmt->fetch();
                if ($assignee) {
                    // Get application/client info if linked
                    $appId = null; $clientName = null;
                    if (!empty($data['application'])) {
                        $appStmt = $db->prepare("SELECT a.application_id, u.name as client_name FROM applications a LEFT JOIN users u ON a.client_id = u.id WHERE a.id = ?");
                        $appStmt->execute([$data['application']]);
                        $appRow = $appStmt->fetch();
                        if ($appRow) { $appId = $appRow['application_id']; $clientName = $appRow['client_name']; }
                    }
                    Mailer::sendTaskAssignedEmail(
                        $assignee['email'], $assignee['name'],
                        $data['title'] ?? '', $data['description'] ?? '',
                        $data['priority'] ?? 'medium', $data['dueDate'] ?? null,
                        $appId, $clientName
                    );
                }
            } catch (Throwable $e) {
                appLog('error', 'Failed to send task assigned email', ['taskId' => $id, 'error' => $e->getMessage()]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        jsonResponse(['task' => self::formatTask($stmt->fetch(), $db)], 201);
    }

    // POST /api/admin/tasks/create-with-client
    // Handles: optional external client creation, application creation, doc upload, task creation
    // Accepts multipart/form-data (because docs are uploaded)
    public static function createWithClient() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();

        // Parse fields
        $appType      = $_POST['appType']      ?? 'existing'; // 'existing' | 'external'
        $existingAppId= $_POST['existingAppId'] ?? null;
        $serviceId    = !empty($_POST['serviceId']) ? (int)$_POST['serviceId'] : null;
        $customPrice  = isset($_POST['customPrice']) && $_POST['customPrice'] !== '' ? (float)$_POST['customPrice'] : null;
        $assignedTo   = !empty($_POST['assignedTo'])   ? (int)$_POST['assignedTo']   : null;
        $title        = trim($_POST['title']        ?? '');
        $description  = trim($_POST['description']  ?? '');
        $priority     = $_POST['priority']  ?? 'medium';
        $dueDate      = !empty($_POST['dueDate']) ? $_POST['dueDate'] : null;
        $notes        = trim($_POST['notes']        ?? '');

        if (!$title)       jsonResponse(['error' => 'Task title is required'], 400);
        if (!$assignedTo)  jsonResponse(['error' => 'Assigned employee is required'], 400);

        $applicationDbId = null;
        $clientId        = null;

        if ($appType === 'existing') {
            // Link to existing application
            if ($existingAppId) {
                $s = $db->prepare("SELECT id, client_id FROM applications WHERE id = ?");
                $s->execute([$existingAppId]);
                $appRow = $s->fetch();
                if (!$appRow) jsonResponse(['error' => 'Application not found'], 404);
                $applicationDbId = (int)$appRow['id'];
                $clientId        = (int)$appRow['client_id'];
            }
        } else {
            // External application — create client + application
            $clientName    = trim($_POST['clientName']    ?? '');
            $clientEmail   = strtolower(trim($_POST['clientEmail'] ?? ''));
            $clientPhone   = trim($_POST['clientPhone']   ?? '');
            $clientCompany = trim($_POST['clientCompany'] ?? '');
            $clientAddress = trim($_POST['clientAddress'] ?? '');

            if (!$clientName)  jsonResponse(['error' => 'Client name is required'], 400);
            if (!$clientEmail) jsonResponse(['error' => 'Client email is required'], 400);
            if (!$serviceId)   jsonResponse(['error' => 'Service is required for external application'], 400);

            // Check / create client
            $s = $db->prepare("SELECT id FROM users WHERE email = ?");
            $s->execute([$clientEmail]);
            $existingUser = $s->fetch();

            if ($existingUser) {
                $clientId = (int)$existingUser['id'];
            } else {
                $pwd = password_hash('Welcome@123', PASSWORD_BCRYPT);
                $ins = $db->prepare("INSERT INTO users (name, email, phone, password, role, company_name, address_street, is_verified, is_active) VALUES (?,?,?,?,'client',?,?,1,1)");
                $ins->execute([$clientName, $clientEmail, $clientPhone, $pwd, $clientCompany ?: null, $clientAddress ?: null]);
                $clientId = (int)$db->lastInsertId();
            }

            // Get service pricing
            $svc = $db->prepare("SELECT * FROM services WHERE id = ? AND is_active = 1");
            $svc->execute([$serviceId]);
            $service = $svc->fetch();
            if (!$service) jsonResponse(['error' => 'Service not found'], 404);

            $defaultPrice = (float)$service['pricing_base_price'];
            $gstPct       = (float)($service['pricing_gst_percent'] ?? 18);
            $finalBase    = $customPrice !== null ? $customPrice : $defaultPrice;
            $finalGst     = round($finalBase * $gstPct / 100, 2);
            $finalTotal   = $finalBase + $finalGst;

            // Generate application ID
            $cnt = (int)$db->query("SELECT COUNT(*) FROM applications")->fetchColumn();
            $appId = 'HS-' . str_pad($cnt + 1001, 6, '0', STR_PAD_LEFT);

            $ins = $db->prepare("INSERT INTO applications (application_id, client_id, service_id, form_data, payment_amount, payment_gst, payment_total, status) VALUES (?,?,?,?,?,?,?,'submitted')");
            $ins->execute([$appId, $clientId, $serviceId, '{}', $finalBase, $finalGst, $finalTotal]);
            $applicationDbId = (int)$db->lastInsertId();

            // Timeline
            $db->prepare("INSERT INTO application_timeline (application_id, status, message, updated_by) VALUES (?, 'submitted', 'Application created via task assignment', ?)")
               ->execute([$applicationDbId, Auth::userId()]);

            if ($notes) {
                $db->prepare("INSERT INTO application_notes (application_id, text, author_id) VALUES (?,?,?)")
                   ->execute([$applicationDbId, $notes, Auth::userId()]);
            }

            // Handle document uploads
            if (!empty($_FILES)) {
                $uploadDir = __DIR__ . '/../../uploads/applications/' . $applicationDbId . '/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

                foreach ($_FILES as $fieldKey => $file) {
                    if ($file['error'] !== UPLOAD_ERR_OK) continue;
                    $origName = basename($file['name']);
                    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                    $stored = uniqid('doc_') . '.' . $ext;
                    $dest = $uploadDir . $stored;
                    if (move_uploaded_file($file['tmp_name'], $dest)) {
                        $db->prepare("INSERT INTO application_documents (application_id, name, original_name, path, mime_type, size, uploaded_by, category) VALUES (?,?,?,?,?,?,?,?)")
                           ->execute([$applicationDbId, $fieldKey, $origName, 'uploads/applications/' . $applicationDbId . '/' . $stored, $file['type'], $file['size'], Auth::userId(), 'required']);
                    }
                }
            }
        }

        // Create the task
        $ins = $db->prepare("INSERT INTO tasks (application_id, assigned_to, assigned_by, title, description, status, priority, due_date) VALUES (?,?,?,?,?,'pending',?,?)");
        $ins->execute([$applicationDbId, $assignedTo, Auth::userId(), $title, $description, $priority, $dueDate]);
        $taskId = (int)$db->lastInsertId();

        // Sync assigned employee + priority back to the linked application so the Application tab stays consistent
        if ($applicationDbId) {
            $db->prepare("UPDATE applications SET assigned_employee_id = ?, priority = ? WHERE id = ?")
               ->execute([$assignedTo, $priority, $applicationDbId]);
        }

        // Notify assignee
        $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'New Task Assigned', ?, 'task', ?)")
           ->execute([$assignedTo, "New task: $title", "/employee/tasks/$taskId"]);

        try {
            $ae = $db->prepare("SELECT name, email FROM users WHERE id = ?");
            $ae->execute([$assignedTo]);
            $assignee = $ae->fetch();
            if ($assignee) {
                $appIdStr = null; $clientNameStr = null;
                if ($applicationDbId) {
                    $ar = $db->prepare("SELECT a.application_id, u.name as client_name FROM applications a LEFT JOIN users u ON a.client_id = u.id WHERE a.id = ?");
                    $ar->execute([$applicationDbId]);
                    $appRow = $ar->fetch();
                    if ($appRow) { $appIdStr = $appRow['application_id']; $clientNameStr = $appRow['client_name']; }
                }
                Mailer::sendTaskAssignedEmail($assignee['email'], $assignee['name'], $title, $description, $priority, $dueDate, $appIdStr, $clientNameStr);
            }
        } catch (Throwable $e) {}

        $s = $db->prepare("SELECT * FROM tasks WHERE id = ?");
        $s->execute([$taskId]);
        jsonResponse(['task' => self::formatTask($s->fetch(), $db)], 201);
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

        // Sync assigned_employee_id / priority back to the linked application
        if ($t['application_id'] && (isset($data['assignedTo']) || isset($data['priority']))) {
            $appFields = []; $appParams = [];
            if (isset($data['assignedTo'])) { $appFields[] = "assigned_employee_id = ?"; $appParams[] = $data['assignedTo']; }
            if (isset($data['priority']))   { $appFields[] = "priority = ?";             $appParams[] = $data['priority']; }
            $appParams[] = $t['application_id'];
            $db->prepare("UPDATE applications SET " . implode(', ', $appFields) . " WHERE id = ?")->execute($appParams);
        }

        jsonResponse(['task' => self::formatTask($t, $db)]);
    }

    // PUT|PATCH /api/tasks/:id/status
    public static function updateTaskStatus($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $data = getJsonInput();
        $db = getDb();
        $status = $data['status'] ?? '';
        $remarks = $data['remarks'] ?? '';
        $user = Auth::user();

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $t = $stmt->fetch();
        if (!$t) jsonResponse(['error' => 'Task not found'], 404);

        // Employees cannot directly mark as 'completed' — must upload final docs first
        if ($status === 'completed' && $user['role'] === 'employee') {
            jsonResponse(['error' => 'Please upload final documents to submit the task for review.'], 422);
        }
        // 'pending_review' is set by the upload-final-docs endpoint, not directly
        if ($status === 'pending_review' && $user['role'] === 'employee') {
            jsonResponse(['error' => 'Use the final document upload flow to submit for review.'], 422);
        }

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

    // GET /api/tasks/:id/final-docs
    public static function getFinalDocs($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Task not found'], 404);

        $s = $db->prepare("SELECT tfd.*, u.name as uploader_name FROM task_final_documents tfd LEFT JOIN users u ON tfd.uploaded_by = u.id WHERE tfd.task_id = ? ORDER BY tfd.uploaded_at DESC");
        $s->execute([$id]);
        $docs = array_map(fn($d) => [
            'id' => (int)$d['id'], 'name' => $d['name'], 'docType' => $d['doc_type'],
            'description' => $d['description'], 'originalName' => $d['original_name'],
            'path' => $d['path'], 'mimeType' => $d['mime_type'], 'size' => (int)$d['size'],
            'uploadedBy' => $d['uploader_name'], 'uploadedAt' => $d['uploaded_at'],
            'hasPassword' => !empty($d['password']),
        ], $s->fetchAll());
        jsonResponse(['documents' => $docs]);
    }

    // POST /api/tasks/:id/final-docs  (multipart/form-data)
    public static function uploadFinalDocs($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $db = getDb();

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $task = $stmt->fetch();
        if (!$task) jsonResponse(['error' => 'Task not found'], 404);

        $user = Auth::user();
        if ($user['role'] === 'employee' && (int)$task['assigned_to'] !== (int)$user['id']) {
            jsonResponse(['error' => 'Forbidden — this task is not assigned to you'], 403);
        }

        if (empty($_FILES)) jsonResponse(['error' => 'No files uploaded'], 400);

        $uploadDir = __DIR__ . '/../../uploads/task-final-docs/' . $id . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        // Metadata arrays indexed by file slot
        $docNames     = isset($_POST['docNames'])     ? (array)$_POST['docNames']     : [];
        $docTypes     = isset($_POST['docTypes'])     ? (array)$_POST['docTypes']     : [];
        $docDescs     = isset($_POST['docDescs'])     ? (array)$_POST['docDescs']     : [];
        $docPasswords = isset($_POST['docPasswords']) ? (array)$_POST['docPasswords'] : [];

        $uploaded = [];
        $i = 0;
        foreach ($_FILES as $key => $file) {
            if ($file['error'] !== UPLOAD_ERR_OK) { $i++; continue; }
            $origName = basename($file['name']);
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $stored = uniqid('final_') . '.' . $ext;
            $dest = $uploadDir . $stored;
            if (move_uploaded_file($file['tmp_name'], $dest)) {
                $docName = !empty($docNames[$i]) ? trim($docNames[$i]) : pathinfo($origName, PATHINFO_FILENAME);
                $docType = $docTypes[$i] ?? null;
                $docDesc = $docDescs[$i] ?? null;
                $docPass = !empty($docPasswords[$i]) ? $docPasswords[$i] : null;
                $db->prepare("INSERT INTO task_final_documents (task_id, name, doc_type, description, password, original_name, path, mime_type, size, uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?)")
                   ->execute([$id, $docName, $docType ?: null, $docDesc ?: null, $docPass, $origName, 'uploads/task-final-docs/' . $id . '/' . $stored, $file['type'], $file['size'], Auth::userId()]);
                $uploaded[] = ['name' => $docName, 'originalName' => $origName, 'size' => $file['size']];
            }
            $i++;
        }

        if (empty($uploaded)) jsonResponse(['error' => 'No files were successfully saved'], 400);

        // Move task to pending_review
        $db->prepare("UPDATE tasks SET status = 'pending_review', updated_at = NOW() WHERE id = ?")->execute([$id]);

        if ($remarks = trim($_POST['remarks'] ?? '')) {
            $db->prepare("INSERT INTO task_remarks (task_id, text, author_id) VALUES (?,?,?)")
               ->execute([$id, $remarks, Auth::userId()]);
        }

        // Notify admins
        $admins = $db->query("SELECT id FROM users WHERE role = 'admin' AND is_active = 1")->fetchAll();
        foreach ($admins as $admin) {
            $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'Task Ready for Review', ?, 'task', ?)")
               ->execute([$admin['id'], "Task \"{$task['title']}\" has been submitted with " . count($uploaded) . " final document(s). Ready for admin review.", "/admin/tasks"]);
        }

        $s = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $s->execute([$id]);
        jsonResponse(['success' => true, 'uploaded' => count($uploaded), 'task' => self::formatTask($s->fetch(), $db)]);
    }

    // POST /api/tasks/:id/approve — admin approves final docs → completed
    public static function approveTask($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $task = $stmt->fetch();
        if (!$task) jsonResponse(['error' => 'Task not found'], 404);

        $docStmt = $db->prepare("SELECT COUNT(*) FROM task_final_documents WHERE task_id = ?");
        $docStmt->execute([$id]);
        if ((int)$docStmt->fetchColumn() === 0) {
            jsonResponse(['error' => 'No final documents found. Employee must upload documents first.'], 422);
        }

        $db->prepare("UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ?")->execute([$id]);

        $remarks = trim($data['remarks'] ?? 'Task approved by admin.');
        $db->prepare("INSERT INTO task_remarks (task_id, text, author_id) VALUES (?,?,?)")
           ->execute([$id, $remarks, Auth::userId()]);

        // Notify assigned employee
        $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'Task Approved ✓', ?, 'task', ?)")
           ->execute([$task['assigned_to'], "Your task \"{$task['title']}\" has been reviewed and approved. Great work!", "/employee/tasks"]);

        $s = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $s->execute([$id]);
        jsonResponse(['success' => true, 'task' => self::formatTask($s->fetch(), $db)]);
    }

    // POST /api/tasks/:id/reject — admin rejects final docs → back to in-progress
    public static function rejectTask($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $stmt->execute([$id]);
        $task = $stmt->fetch();
        if (!$task) jsonResponse(['error' => 'Task not found'], 404);

        $db->prepare("UPDATE tasks SET status = 'in-progress', updated_at = NOW() WHERE id = ?")->execute([$id]);

        $remarks = trim($data['remarks'] ?? 'Returned for revision.');
        $db->prepare("INSERT INTO task_remarks (task_id, text, author_id) VALUES (?,?,?)")
           ->execute([$id, "[Revision Requested] $remarks", Auth::userId()]);

        // Notify employee
        $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, 'Task Returned for Revision', ?, 'task', ?)")
           ->execute([$task['assigned_to'], "Task \"{$task['title']}\" has been returned for revision. Reason: $remarks", "/employee/tasks"]);

        $s = $db->prepare("SELECT * FROM tasks WHERE id = ?"); $s->execute([$id]);
        jsonResponse(['success' => true, 'task' => self::formatTask($s->fetch(), $db)]);
    }
}
