<?php
class ApplicationController {

    private static function formatApp($a, $db) {
        if (!$a) return null;
        $id = (int)$a['id'];

        // Load client
        $client = null;
        if ($a['client_id']) {
            $s = $db->prepare("SELECT * FROM users WHERE id = ?"); $s->execute([$a['client_id']]);
            $client = formatUser($s->fetch());
        }
        // Load service
        $service = null;
        if ($a['service_id']) {
            $s = $db->prepare("SELECT * FROM services WHERE id = ?"); $s->execute([$a['service_id']]);
            $srv = $s->fetch();
            $service = $srv ? formatService($srv, $db) : null;
        }
        // Load assigned employee
        $employee = null;
        if ($a['assigned_employee_id']) {
            $s = $db->prepare("SELECT * FROM users WHERE id = ?"); $s->execute([$a['assigned_employee_id']]);
            $employee = formatUser($s->fetch());
        }
        // Load documents
        $s = $db->prepare("SELECT * FROM application_documents WHERE application_id = ? AND is_completed = 0");
        $s->execute([$id]);
        $docs = array_map(fn($d) => [
            'name' => $d['name'], 'originalName' => $d['original_name'], 'path' => $d['path'],
            'mimeType' => $d['mime_type'], 'size' => (int)$d['size'],
            'uploadedAt' => $d['uploaded_at'], 'category' => $d['category'],
        ], $s->fetchAll());

        $s = $db->prepare("SELECT * FROM application_documents WHERE application_id = ? AND is_completed = 1");
        $s->execute([$id]);
        $completedDocs = array_map(fn($d) => [
            'name' => $d['name'], 'originalName' => $d['original_name'], 'path' => $d['path'],
            'mimeType' => $d['mime_type'], 'size' => (int)$d['size'], 'uploadedAt' => $d['uploaded_at'],
        ], $s->fetchAll());

        // Load notes
        $s = $db->prepare("SELECT n.*, u.name as author_name, u.role as author_role FROM application_notes n LEFT JOIN users u ON n.author_id = u.id WHERE n.application_id = ? ORDER BY n.created_at");
        $s->execute([$id]);
        $notes = array_map(fn($n) => [
            'text' => $n['text'],
            'author' => ['_id' => (string)$n['author_id'], 'name' => $n['author_name'], 'role' => $n['author_role']],
            'createdAt' => $n['created_at'], 'isInternal' => (bool)$n['is_internal'],
        ], $s->fetchAll());

        // Load timeline
        $s = $db->prepare("SELECT t.*, u.name as updater_name, u.role as updater_role FROM application_timeline t LEFT JOIN users u ON t.updated_by = u.id WHERE t.application_id = ? ORDER BY t.created_at");
        $s->execute([$id]);
        $timeline = array_map(fn($t) => [
            'status' => $t['status'], 'message' => $t['message'], 'timestamp' => $t['created_at'],
            'updatedBy' => $t['updated_by'] ? ['_id' => (string)$t['updated_by'], 'name' => $t['updater_name'], 'role' => $t['updater_role']] : null,
        ], $s->fetchAll());

        return [
            'id' => $id, '_id' => (string)$id,
            'applicationId' => $a['application_id'],
            'client' => $client, 'service' => $service, 'assignedEmployee' => $employee,
            'status' => $a['status'], 'priority' => $a['priority'],
            'documents' => $docs, 'completedDocuments' => $completedDocs,
            'notes' => $notes, 'timeline' => $timeline,
            'formData' => json_decode($a['form_data'] ?? '{}', true) ?: new \stdClass(),
            'payment' => [
                'amount' => (float)$a['payment_amount'], 'gst' => (float)$a['payment_gst'],
                'total' => (float)$a['payment_total'], 'status' => $a['payment_status'],
                'razorpayOrderId' => $a['payment_razorpay_order_id'],
                'razorpayPaymentId' => $a['payment_razorpay_payment_id'],
                'paidAt' => $a['payment_paid_at'],
            ],
            'dueDate' => $a['due_date'], 'completedAt' => $a['completed_at'],
            'createdAt' => $a['created_at'], 'updatedAt' => $a['updated_at'],
        ];
    }

    // GET /api/applications
    public static function getApplications() {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $db = getDb();
        $status = $_GET['status'] ?? '';
        $priority = $_GET['priority'] ?? '';
        $search = $_GET['search'] ?? '';
        $assignedEmployee = $_GET['assignedEmployee'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 20));

        $where = []; $params = [];
        if ($status) { $where[] = "a.status = ?"; $params[] = $status; }
        if ($priority) { $where[] = "a.priority = ?"; $params[] = $priority; }
        if ($assignedEmployee) { $where[] = "a.assigned_employee_id = ?"; $params[] = $assignedEmployee; }
        if (Auth::user()['role'] === 'employee') { $where[] = "a.assigned_employee_id = ?"; $params[] = Auth::userId(); }
        if ($search) { $where[] = "a.application_id LIKE ?"; $params[] = "%$search%"; }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $db->prepare("SELECT COUNT(*) FROM applications a $whereSQL");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $offset = ($page - 1) * $limit;
        $stmt = $db->prepare("SELECT a.* FROM applications a $whereSQL ORDER BY a.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $apps = array_map(fn($a) => self::formatApp($a, $db), $stmt->fetchAll());

        jsonResponse([
            'applications' => $apps,
            'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)],
        ]);
    }

    // GET /api/applications/my
    public static function getMyApplications() {
        Auth::protect();
        $db = getDb();
        $status = $_GET['status'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 20));

        $where = ["a.client_id = ?"]; $params = [Auth::userId()];
        if ($status) { $where[] = "a.status = ?"; $params[] = $status; }
        $whereSQL = 'WHERE ' . implode(' AND ', $where);

        $stmt = $db->prepare("SELECT COUNT(*) FROM applications a $whereSQL");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $offset = ($page - 1) * $limit;
        $stmt = $db->prepare("SELECT a.* FROM applications a $whereSQL ORDER BY a.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $apps = array_map(fn($a) => self::formatApp($a, $db), $stmt->fetchAll());

        jsonResponse([
            'applications' => $apps,
            'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)],
        ]);
    }

    // GET /api/applications/:id
    public static function getApplicationById($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        $a = $stmt->fetch();
        if (!$a) jsonResponse(['error' => 'Application not found'], 404);

        if (Auth::user()['role'] === 'client' && (int)$a['client_id'] !== Auth::userId()) {
            jsonResponse(['error' => 'Not authorized'], 403);
        }

        jsonResponse(['application' => self::formatApp($a, $db)]);
    }

    // POST /api/applications
    public static function createApplication() {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();

        $serviceId = $data['serviceId'] ?? null;
        if (!$serviceId) jsonResponse(['error' => 'Service ID required'], 400);

        $serviceStmt = $db->prepare("SELECT * FROM services WHERE id = ? AND is_active = 1");
        $serviceStmt->execute([$serviceId]);
        $service = $serviceStmt->fetch();
        if (!$service) jsonResponse(['error' => 'Service not found'], 404);

        $pricing = normalizeServicePricing([
            'basePrice' => $service['pricing_base_price'],
            'gstPercent' => $service['pricing_gst_percent'],
            'totalPrice' => $service['pricing_total_price'],
            'isCustom' => $service['pricing_is_custom'],
            'pricingNote' => $service['pricing_note'],
        ]);

        // Generate application ID
        $stmt = $db->query("SELECT COUNT(*) FROM applications");
        $count = (int)$stmt->fetchColumn();
        $appId = 'HS-' . str_pad($count + 1001, 6, '0', STR_PAD_LEFT);

        $formPayload = isset($data['formData']) ? (is_array($data['formData']) ? $data['formData'] : (json_decode($data['formData'], true) ?: [])) : [];
        $validatedFieldValues = validateApplicationFormData($db, $serviceId, $formPayload);
        $formData = json_encode($formPayload);

        $stmt = $db->prepare("INSERT INTO applications (application_id, client_id, service_id, form_data, payment_amount, payment_gst, payment_total) VALUES (?,?,?,?,?,?,?)");
        $stmt->execute([
            $appId,
            Auth::userId(),
            $serviceId,
            $formData,
            $pricing['basePrice'],
            round($pricing['totalPrice'] - $pricing['basePrice'], 2),
            $pricing['totalPrice'],
        ]);
        $id = (int)$db->lastInsertId();
        saveApplicationFieldValues($db, $id, $validatedFieldValues);

        // Timeline entry
        $db->prepare("INSERT INTO application_timeline (application_id, status, message, updated_by) VALUES (?, 'submitted', 'Application submitted', ?)")
           ->execute([$id, Auth::userId()]);

        // Notes
        if (!empty($data['notes'])) {
            $db->prepare("INSERT INTO application_notes (application_id, text, author_id) VALUES (?,?,?)")
               ->execute([$id, $data['notes'], Auth::userId()]);
        }

        // Notify admins
        $admins = $db->query("SELECT id FROM users WHERE role = 'admin' AND is_active = 1")->fetchAll();
        $userName = Auth::user()['name'];
        foreach ($admins as $admin) {
            createNotification($db, $admin['id'], 'New Application', "New application $appId submitted by $userName", 'application', "/admin/applications/$id", 'in_app', ['applicationId' => $id]);
        }

        $serviceName = $service['name'];
        try {
            Mailer::queueTemplate($db, 'registration-service-request', Auth::user()['email'], Auth::user()['name'], [
                'user' => Auth::user(),
                'applicationId' => $appId,
                'serviceName' => $serviceName,
                'status' => 'submitted',
            ]);
        } catch (Throwable $e) {
            appLog('error', 'Failed to queue service request email', ['applicationId' => $appId, 'error' => $e->getMessage()]);
        }

        // Activity log
        $db->prepare("INSERT INTO activity_logs (user_id, action, entity, entity_id, details) VALUES (?, 'Application created', 'application', ?, ?)")
           ->execute([Auth::userId(), $id, json_encode(['serviceId' => $serviceId, 'pricing' => $pricing])]);

        appLog('info', 'Application created', ['applicationId' => $appId, 'serviceId' => (int)$serviceId, 'userId' => Auth::userId()]);

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['application' => self::formatApp($stmt->fetch(), $db)], 201);
    }

    // PUT /api/applications/:id
    public static function updateApplication($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $data = getJsonInput();
        $db = getDb();

        $fields = []; $params = [];
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
        if (isset($data['priority'])) { $fields[] = "priority = ?"; $params[] = $data['priority']; }
        if (isset($data['assignedEmployee'])) { $fields[] = "assigned_employee_id = ?"; $params[] = $data['assignedEmployee']; }
        if (isset($data['dueDate'])) { $fields[] = "due_date = ?"; $params[] = $data['dueDate']; }

        if ($fields) {
            $params[] = $id;
            $db->prepare("UPDATE applications SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        $a = $stmt->fetch();
        if (!$a) jsonResponse(['error' => 'Application not found'], 404);
        jsonResponse(['application' => self::formatApp($a, $db)]);
    }

    // PUT|PATCH /api/applications/:id/status
    public static function updateStatus($id) {
        Auth::protect(); Auth::authorize('admin', 'employee');
        $data = getJsonInput();
        $db = getDb();
        $status = $data['status'] ?? '';
        $message = $data['message'] ?? "Status updated to $status";

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        $a = $stmt->fetch();
        if (!$a) jsonResponse(['error' => 'Application not found'], 404);

        $extra = '';
        $extraParams = [$status, $id];
        if ($status === 'completed') {
            $extra = ", completed_at = NOW()";
        }
        $db->prepare("UPDATE applications SET status = ?$extra WHERE id = ?")->execute($extraParams);

        $db->prepare("INSERT INTO application_timeline (application_id, status, message, updated_by) VALUES (?,?,?,?)")
           ->execute([$id, $status, $message, Auth::userId()]);

        // Notify client
        createNotification($db, $a['client_id'], 'Application Update', "Your application {$a['application_id']} status changed to $status", 'application', "/dashboard/applications/$id", 'in_app', ['applicationId' => $id, 'status' => $status]);

        $clientStmt = $db->prepare("SELECT name, email FROM users WHERE id = ?");
        $clientStmt->execute([$a['client_id']]);
        $client = $clientStmt->fetch();
        if ($client) {
            try {
                Mailer::queueTemplate($db, 'application-status-update', $client['email'], $client['name'], [
                    'applicationId' => $a['application_id'],
                    'status' => $status,
                    'message' => $message,
                ]);
            } catch (Throwable $e) {
                appLog('error', 'Failed to queue application update email', ['applicationId' => $id, 'error' => $e->getMessage()]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['application' => self::formatApp($stmt->fetch(), $db)]);
    }

    // PUT /api/applications/:id/assign
    public static function assignEmployee($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();
        $employeeId = $data['employeeId'] ?? null;

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        $a = $stmt->fetch();
        if (!$a) jsonResponse(['error' => 'Application not found'], 404);

        $db->prepare("UPDATE applications SET assigned_employee_id = ? WHERE id = ?")->execute([$employeeId, $id]);

        $db->prepare("INSERT INTO application_timeline (application_id, status, message, updated_by) VALUES (?,?,?,?)")
           ->execute([$id, $a['status'], 'Employee assigned', Auth::userId()]);

        // Notify employee
        createNotification($db, $employeeId, 'New Task Assigned', "You have been assigned application {$a['application_id']}", 'task', "/employee/applications/$id", 'in_app', ['applicationId' => $id]);

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['application' => self::formatApp($stmt->fetch(), $db)]);
    }

    // POST /api/applications/:id/documents
    public static function uploadDocuments($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT id FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Application not found'], 404);

        $isCompleted = ($_POST['isCompleted'] ?? 'false') === 'true' ? 1 : 0;

        if (!empty($_FILES['documents'])) {
            $uploadDir = __DIR__ . '/../../uploads/applications/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $files = $_FILES['documents'];
            $count = is_array($files['name']) ? count($files['name']) : 1;

            for ($i = 0; $i < $count; $i++) {
                $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
                $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
                $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];
                $type = is_array($files['type']) ? $files['type'][$i] : $files['type'];

                $ext = pathinfo($name, PATHINFO_EXTENSION);
                $filename = bin2hex(random_bytes(16)) . '.' . $ext;
                move_uploaded_file($tmpName, $uploadDir . $filename);

                $db->prepare("INSERT INTO application_documents (application_id, name, original_name, path, mime_type, size, uploaded_by, is_completed) VALUES (?,?,?,?,?,?,?,?)")
                   ->execute([$id, $name, $name, "/uploads/applications/$filename", $type, $size, Auth::userId(), $isCompleted]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['application' => self::formatApp($stmt->fetch(), $db)]);
    }
}
