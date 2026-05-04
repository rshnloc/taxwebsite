<?php
class PartnerServiceRequestController {

    // POST /api/partner/service-requests — partner only (multipart form-data)
    public static function create() {
        $user = Auth::protect();
        if ($user['role'] !== 'partner') jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();

        // Validate partner is approved and has approved rate card
        $s = $db->prepare("SELECT partner_status FROM users WHERE id = ?"); $s->execute([$user['id']]);
        $partnerRow = $s->fetch();
        if (!$partnerRow || $partnerRow['partner_status'] !== 'approved') {
            jsonResponse(['error' => 'Your partner profile must be approved before submitting service requests.'], 403);
        }

        $serviceId = (int)($_POST['serviceId'] ?? 0);
        if (!$serviceId) jsonResponse(['error' => 'serviceId is required'], 422);

        // Verify approved rate card exists for this partner + service
        $rc = $db->prepare("SELECT id, partner_price FROM partner_rate_cards WHERE partner_id = ? AND service_id = ? AND status = 'rate_approved' LIMIT 1");
        $rc->execute([$user['id'], $serviceId]); $rateCard = $rc->fetch();
        if (!$rateCard) {
            jsonResponse(['error' => 'No approved rate card found for this service. Please wait for admin to approve your rate card.'], 403);
        }

        // Get service info
        $svc = $db->prepare("SELECT id, name FROM services WHERE id = ? AND is_active = 1"); $svc->execute([$serviceId]);
        $service = $svc->fetch();
        if (!$service) jsonResponse(['error' => 'Service not found or inactive'], 404);

        // "Applying For" core fields
        $clientName  = trim($_POST['clientName']  ?? '');
        $clientEmail = trim($_POST['clientEmail'] ?? '');
        $clientPhone = trim($_POST['clientPhone'] ?? '');

        if (!$clientName || !$clientEmail) {
            jsonResponse(['error' => 'clientName and clientEmail are required'], 422);
        }
        if (!filter_var($clientEmail, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Invalid client email'], 422);
        }

        // Dynamic form fields from POST (prefixed with "field_")
        $dynamicData = [];
        foreach ($_POST as $key => $val) {
            if (strpos($key, 'field_') === 0) {
                $fieldKey = substr($key, 6);
                $dynamicData[$fieldKey] = $val;
            }
        }

        // Generate request reference
        $ref = 'PSR-' . strtoupper(substr(md5(uniqid()), 0, 8));

        $stmt = $db->prepare("
            INSERT INTO partner_service_requests
                (reference, partner_id, service_id, rate_card_id, client_name, client_email, client_phone,
                 dynamic_data, agreed_price, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
        ");
        $stmt->execute([
            $ref, $user['id'], $serviceId, (int)$rateCard['id'],
            $clientName, $clientEmail, $clientPhone,
            json_encode($dynamicData),
            (float)$rateCard['partner_price'],
        ]);
        $requestId = (int)$db->lastInsertId();

        // Handle document uploads
        $uploadDir = __DIR__ . '/../../uploads/partner-requests/' . $requestId . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);

        if (!empty($_FILES)) {
            foreach ($_FILES as $inputName => $fileInfo) {
                if (!strpos($inputName, 'doc_') === 0) continue;
                $files = is_array($fileInfo['name'])
                    ? array_map(fn($k) => array_column(array_map(fn($field) => [$field => $fileInfo[$field][$k]], array_keys($fileInfo)), null, array_keys($fileInfo)), array_keys($fileInfo['name']))
                    : [$fileInfo];

                // Handle single file under this input
                if (!is_array($fileInfo['name'])) {
                    if ($fileInfo['error'] !== UPLOAD_ERR_OK) continue;
                    $origName = basename($fileInfo['name']);
                    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                    $safeName = 'doc_' . time() . '_' . rand(1000,9999) . '.' . $ext;
                    $dest = $uploadDir . $safeName;
                    if (move_uploaded_file($fileInfo['tmp_name'], $dest)) {
                        $fieldKey = substr($inputName, 4); // strip "doc_"
                        $isPasswordProtected = !empty($_POST['pwd_' . $fieldKey]) ? 1 : 0;
                        $password = $isPasswordProtected ? $_POST['pwd_' . $fieldKey] : null;
                        $db->prepare("
                            INSERT INTO partner_request_documents
                                (request_id, field_key, original_name, stored_name, path, mime_type, size, is_password_protected, doc_password)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ")->execute([
                            $requestId, $fieldKey, $origName, $safeName,
                            'uploads/partner-requests/' . $requestId . '/' . $safeName,
                            $fileInfo['type'], $fileInfo['size'], $isPasswordProtected, $password
                        ]);
                    }
                }
            }
        }

        // Audit log
        PartnerController::auditLog($db, $user['id'], $user['id'], 'service_request_submitted', 'partner_service_request', $requestId, "Request $ref for service #{$serviceId}");

        // Email partner confirmation
        try { Mailer::sendPartnerServiceRequestConfirmation($user['email'], $user['name'], $service['name'], $ref); } catch (Throwable $e) {}

        // Notify admins
        $admins = $db->query("SELECT email, name FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 3")->fetchAll();
        foreach ($admins as $admin) {
            try { Mailer::sendPartnerServiceRequestAdminNotify($admin['email'], $admin['name'], $user['name'], $service['name'], $ref); } catch (Throwable $e) {}
        }

        $req = self::fetchRequest($db, $requestId);
        jsonResponse(['success' => true, 'reference' => $ref, 'request' => $req], 201);
    }

    // GET /api/partner/service-requests — partner sees own requests
    public static function getMy() {
        $user = Auth::protect();
        if ($user['role'] !== 'partner') jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();
        $s = $db->prepare("
            SELECT psr.*, s.name AS service_name, s.slug AS service_slug
            FROM partner_service_requests psr
            LEFT JOIN services s ON s.id = psr.service_id
            WHERE psr.partner_id = ?
            ORDER BY psr.created_at DESC
        ");
        $s->execute([$user['id']]);
        $rows = $s->fetchAll();
        $requests = array_map(fn($r) => self::formatRequest($r, $db), $rows);
        jsonResponse(['requests' => $requests]);
    }

    // GET /api/admin/partner-requests — admin/employee
    public static function getAll() {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();

        $status  = $_GET['status'] ?? '';
        $search  = $_GET['search'] ?? '';
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $limit   = min(100, (int)($_GET['limit'] ?? 20));
        $offset  = ($page - 1) * $limit;

        $where = []; $params = [];
        if ($status) { $where[] = "psr.status = ?"; $params[] = $status; }
        if ($search) {
            $where[] = "(psr.reference LIKE ? OR psr.client_name LIKE ? OR psr.client_email LIKE ? OR u.name LIKE ? OR s.name LIKE ?)";
            $q = "%$search%"; $params = array_merge($params, [$q,$q,$q,$q,$q]);
        }
        $whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM partner_service_requests psr LEFT JOIN users u ON u.id = psr.partner_id LEFT JOIN services s ON s.id = psr.service_id $whereStr");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Can't pass params to query() — use prepare
        $sql = "SELECT psr.*, s.name AS service_name, u.name AS partner_name FROM partner_service_requests psr LEFT JOIN users u ON u.id = psr.partner_id LEFT JOIN services s ON s.id = psr.service_id $whereStr ORDER BY psr.created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $db->prepare($sql); $stmt->execute($params); $rows = $stmt->fetchAll();

        $requests = array_map(fn($r) => self::formatRequest($r, $db), $rows);
        jsonResponse(['requests' => $requests, 'total' => $total, 'page' => $page]);
    }

    // GET /api/partner/service-requests/:id
    public static function getById($id) {
        $user = Auth::protect();
        $db   = getDb();
        $req  = self::fetchRequest($db, $id);
        if (!$req) jsonResponse(['error' => 'Not found'], 404);
        if ($user['role'] === 'partner' && $req['partnerId'] !== $user['id']) jsonResponse(['error' => 'Forbidden'], 403);
        if (!in_array($user['role'], ['admin','employee','partner'])) jsonResponse(['error' => 'Forbidden'], 403);
        jsonResponse(['request' => $req]);
    }

    // PATCH /api/admin/partner-requests/:id/status — admin
    public static function updateStatus($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();

        $status   = $data['status'] ?? '';
        $comments = trim($data['comments'] ?? '');
        $valid = ['submitted','under-review','in-progress','completed','rejected','cancelled'];
        if (!in_array($status, $valid)) jsonResponse(['error' => 'Invalid status'], 422);

        $s = $db->prepare("SELECT * FROM partner_service_requests WHERE id = ?"); $s->execute([$id]); $row = $s->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);

        $db->prepare("UPDATE partner_service_requests SET status = ?, admin_comments = ?, updated_at = NOW() WHERE id = ?")
            ->execute([$status, $comments, $id]);

        PartnerController::auditLog($db, $row['partner_id'], $user['id'], "request_$status", 'partner_service_request', $id, $comments);

        // Notify partner
        $p = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $p->execute([$row['partner_id']]); $prt = $p->fetch();
        if ($prt) {
            try { Mailer::sendPartnerRequestStatusUpdate($prt['email'], $prt['name'], $row['reference'], $status, $comments); } catch (Throwable $e) {}
        }

        jsonResponse(['success' => true, 'request' => self::fetchRequest($db, $id)]);
    }

    // ===== HELPERS =====
    private static function fetchRequest($db, $id) {
        $s = $db->prepare("
            SELECT psr.*, s.name AS service_name, s.slug AS service_slug,
                   u.name AS partner_name, u.email AS partner_email
            FROM partner_service_requests psr
            LEFT JOIN services s ON s.id = psr.service_id
            LEFT JOIN users u ON u.id = psr.partner_id
            WHERE psr.id = ?
        ");
        $s->execute([$id]); $r = $s->fetch();
        if (!$r) return null;

        // Load documents
        $docs = $db->prepare("SELECT id, field_key, original_name, path, mime_type, size, is_password_protected FROM partner_request_documents WHERE request_id = ?");
        $docs->execute([$id]);

        return self::formatRequest($r, $db, $docs->fetchAll());
    }

    private static function formatRequest($r, $db, $docs = null) {
        if ($docs === null) {
            $d = $db->prepare("SELECT id, field_key, original_name, path, mime_type, size, is_password_protected FROM partner_request_documents WHERE request_id = ?");
            $d->execute([$r['id']]); $docs = $d->fetchAll();
        }
        return [
            'id'            => (int)$r['id'],
            'reference'     => $r['reference'],
            'partnerId'     => (int)$r['partner_id'],
            'partnerName'   => $r['partner_name'] ?? null,
            'partnerEmail'  => $r['partner_email'] ?? null,
            'serviceId'     => (int)$r['service_id'],
            'serviceName'   => $r['service_name'] ?? null,
            'serviceSlug'   => $r['service_slug'] ?? null,
            'rateCardId'    => (int)$r['rate_card_id'],
            'agreedPrice'   => (float)$r['agreed_price'],
            'clientName'    => $r['client_name'],
            'clientEmail'   => $r['client_email'],
            'clientPhone'   => $r['client_phone'] ?? '',
            'dynamicData'   => json_decode($r['dynamic_data'] ?? '{}', true) ?: new \stdClass(),
            'status'        => $r['status'],
            'adminComments' => $r['admin_comments'] ?? null,
            'documents'     => array_map(fn($d) => [
                'id'                  => (int)$d['id'],
                'fieldKey'            => $d['field_key'],
                'originalName'        => $d['original_name'],
                'path'                => $d['path'],
                'mimeType'            => $d['mime_type'] ?? '',
                'size'                => (int)$d['size'],
                'isPasswordProtected' => (bool)$d['is_password_protected'],
            ], $docs),
            'createdAt'     => $r['created_at'],
            'updatedAt'     => $r['updated_at'],
        ];
    }
}
