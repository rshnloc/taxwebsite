<?php
class PartnerController {

    // POST /api/partners/register — public
    public static function register() {
        $data = getJsonInput();
        $db   = getDb();

        $name     = trim($data['name'] ?? '');
        $email    = strtolower(trim($data['email'] ?? ''));
        $phone    = trim($data['phone'] ?? '');
        $password = $data['password'] ?? '';
        $firmName = trim($data['firmName'] ?? '');
        $aadhaar  = trim($data['aadhaar'] ?? '');
        $pan      = trim($data['pan'] ?? '');
        $gst      = trim($data['gst'] ?? '');
        $city     = trim($data['city'] ?? '');
        $state    = trim($data['state'] ?? '');
        $about    = trim($data['about'] ?? '');

        if (!$name || !$email || !$password || !$phone) {
            jsonResponse(['error' => 'name, email, phone and password are required'], 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Invalid email address'], 422);
        }
        if (strlen($password) < 8) {
            jsonResponse(['error' => 'Password must be at least 8 characters'], 422);
        }

        // Check duplicate email
        $s = $db->prepare("SELECT id FROM users WHERE email = ?");
        $s->execute([$email]);
        if ($s->fetch()) {
            jsonResponse(['error' => 'An account with this email already exists'], 409);
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);

        // Auto-assign reviewer: pick employee with fewest pending partner reviews
        $rv = $db->query("
            SELECT u.id, COUNT(p.id) AS cnt
            FROM users u
            LEFT JOIN users p ON p.partner_assigned_reviewer = u.id AND p.role = 'partner' AND p.partner_status IN ('pending_review','reviewed')
            WHERE u.role = 'employee' AND u.is_active = 1
            GROUP BY u.id
            ORDER BY cnt ASC, RAND()
            LIMIT 1
        ")->fetch();
        $reviewerId = $rv ? (int)$rv['id'] : null;

        $stmt = $db->prepare("
            INSERT INTO users (name, email, phone, password, role, company_name, pan, gst, address_city, address_state, is_active, is_verified,
                partner_status, partner_assigned_reviewer, aadhaar, partner_about, registered_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'partner', ?, ?, ?, ?, ?, 1, 0,
                'pending_review', ?, ?, ?, CURDATE(), NOW(), NOW())
        ");
        $stmt->execute([$name, $email, $phone, $hashed, $firmName, $pan, $gst, $city, $state, $reviewerId, $aadhaar, $about]);
        $partnerId = (int)$db->lastInsertId();

        // Audit log
        self::auditLog($db, $partnerId, $partnerId, 'registered', 'partner', $partnerId, 'Partner self-registered');

        // Send welcome email
        try { Mailer::sendPartnerWelcomeEmail($email, $name); } catch (Throwable $e) {}

        // Notify assigned reviewer
        if ($reviewerId) {
            $rv2 = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $rv2->execute([$reviewerId]);
            $reviewer = $rv2->fetch();
            if ($reviewer) {
                try { Mailer::sendPartnerAssignedEmail($reviewer['email'], $reviewer['name'], $name); } catch (Throwable $e) {}
            }
        }

        $partner = self::fetchPartner($db, $partnerId);
        jsonResponse(['success' => true, 'message' => 'Registration submitted for review', 'partner' => $partner], 201);
    }

    // GET /api/partners/me — partner only
    public static function getMyProfile() {
        $user = Auth::protect();
        if ($user['role'] !== 'partner') jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();
        $partner = self::fetchPartner($db, $user['id']);
        jsonResponse(['partner' => $partner]);
    }

    // PUT /api/partners/me — partner only (update contact info)
    public static function updateMyProfile() {
        $user = Auth::protect();
        if ($user['role'] !== 'partner') jsonResponse(['error' => 'Forbidden'], 403);
        $db   = getDb();
        $data = getJsonInput();

        $allowed = ['name','phone','company_name','pan','gst','address_city','address_state','partner_about','aadhaar'];
        $sets = []; $vals = [];
        foreach ($allowed as $col) {
            $key = lcfirst(str_replace('_', '', ucwords($col, '_')));
            // map camelCase input
            $inputMap = [
                'company_name'    => $data['firmName'] ?? $data['companyName'] ?? null,
                'address_city'    => $data['city'] ?? null,
                'address_state'   => $data['state'] ?? null,
                'partner_about'   => $data['about'] ?? null,
            ];
            $val = $inputMap[$col] ?? $data[$col] ?? $data[$key] ?? null;
            if ($val !== null) { $sets[] = "$col = ?"; $vals[] = $val; }
        }
        if (empty($sets)) jsonResponse(['error' => 'No fields to update'], 422);
        $vals[] = $user['id'];
        $db->prepare("UPDATE users SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = ?")->execute($vals);

        self::auditLog($db, $user['id'], $user['id'], 'profile_updated', 'partner', $user['id'], 'Partner updated own profile');
        $partner = self::fetchPartner($db, $user['id']);
        jsonResponse(['success' => true, 'partner' => $partner]);
    }

    // GET /api/partners — admin/employee
    public static function getAll() {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();

        $status   = $_GET['status'] ?? '';
        $search   = $_GET['search'] ?? '';
        $page     = max(1, (int)($_GET['page'] ?? 1));
        $limit    = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $offset   = ($page - 1) * $limit;

        $where = ["u.role = 'partner'"]; $params = [];
        if ($status) { $where[] = "u.partner_status = ?"; $params[] = $status; }
        if ($search) { $where[] = "(u.name LIKE ? OR u.email LIKE ? OR u.company_name LIKE ?)"; $s = "%$search%"; $params = array_merge($params, [$s,$s,$s]); }

        $whereStr = implode(' AND ', $where);
        $countStmt = $db->prepare("SELECT COUNT(*) FROM users u WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare("SELECT u.* FROM users u WHERE $whereStr ORDER BY u.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $partners = array_map(fn($r) => self::fetchPartner($db, $r['id']), $rows);
        jsonResponse(['partners' => $partners, 'total' => $total, 'page' => $page, 'pages' => ceil($total / $limit)]);
    }

    // GET /api/partners/:id — admin/employee
    public static function getById($id) {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();
        $partner = self::fetchPartner($db, $id);
        if (!$partner) jsonResponse(['error' => 'Partner not found'], 404);
        // Load audit logs
        $logs = $db->prepare("SELECT l.*, u.name AS by_name FROM partner_audit_logs l LEFT JOIN users u ON l.user_id = u.id WHERE l.partner_id = ? ORDER BY l.created_at DESC LIMIT 50");
        $logs->execute([$id]);
        $partner['auditLogs'] = $logs->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['partner' => $partner]);
    }

    // PUT /api/partners/:id/status — admin/employee
    public static function updateStatus($id) {
        $user = Auth::protect();
        if (!in_array($user['role'], ['admin','employee'])) jsonResponse(['error' => 'Forbidden'], 403);
        $db   = getDb();
        $data = getJsonInput();

        $status   = $data['status'] ?? '';
        $comments = trim($data['comments'] ?? '');

        $validStatuses = ['pending_review','reviewed','approved','rejected','needs_update'];
        if (!in_array($status, $validStatuses)) {
            jsonResponse(['error' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses)], 422);
        }

        // Employee can only set pending_review→reviewed; admin can do everything
        if ($user['role'] === 'employee' && $status !== 'reviewed') {
            jsonResponse(['error' => 'Employees can only mark partners as reviewed'], 403);
        }

        // Fetch partner
        $s = $db->prepare("SELECT * FROM users WHERE id = ? AND role = 'partner'"); $s->execute([$id]);
        $partner = $s->fetch();
        if (!$partner) jsonResponse(['error' => 'Partner not found'], 404);

        $oldStatus = $partner['partner_status'];
        $db->prepare("UPDATE users SET partner_status = ?, updated_at = NOW() WHERE id = ?")->execute([$status, $id]);

        // Insert review log
        $db->prepare("INSERT INTO partner_review_logs (partner_id, reviewer_id, action, comments) VALUES (?, ?, ?, ?)")
            ->execute([$id, $user['id'], $status, $comments]);

        self::auditLog($db, $id, $user['id'], "status_changed:$oldStatus->$status", 'partner', $id, $comments);

        // Email partner on key transitions
        $pEmail = $partner['email']; $pName = $partner['name'];
        if ($status === 'approved') {
            try { Mailer::sendPartnerApprovedEmail($pEmail, $pName); } catch (Throwable $e) {}
        } elseif ($status === 'rejected') {
            try { Mailer::sendPartnerRejectedEmail($pEmail, $pName, $comments); } catch (Throwable $e) {}
        } elseif ($status === 'needs_update') {
            try { Mailer::sendPartnerNeedsUpdateEmail($pEmail, $pName, $comments); } catch (Throwable $e) {}
        } elseif ($status === 'reviewed') {
            // Notify admin(s) that employee has reviewed
            $admins = $db->query("SELECT email, name FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 3")->fetchAll();
            foreach ($admins as $admin) {
                try { Mailer::sendPartnerReviewedAdminEmail($admin['email'], $admin['name'], $pName, $user['name']); } catch (Throwable $e) {}
            }
        }

        $updated = self::fetchPartner($db, $id);
        jsonResponse(['success' => true, 'partner' => $updated]);
    }

    // GET /api/partners/my-review-queue — employee only (partners assigned to me)
    public static function getMyReviewQueue() {
        $user = Auth::protect();
        if ($user['role'] !== 'employee') jsonResponse(['error' => 'Forbidden'], 403);
        $db = getDb();
        $s = $db->prepare("SELECT * FROM users WHERE role = 'partner' AND partner_assigned_reviewer = ? ORDER BY created_at DESC");
        $s->execute([$user['id']]);
        $rows = $s->fetchAll();
        $partners = array_map(fn($r) => self::fetchPartner($db, $r['id']), $rows);
        jsonResponse(['partners' => $partners]);
    }

    // POST /api/admin/partners/create — admin creates partner directly (active, no verification)
    public static function adminCreate() {
        $user = Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $name        = trim($data['name'] ?? '');
        $email       = strtolower(trim($data['email'] ?? ''));
        $phone       = trim($data['phone'] ?? '');
        $companyName = trim($data['companyName'] ?? '');
        $gst         = trim($data['gst'] ?? '');
        $pan         = trim($data['pan'] ?? '');
        $city        = trim($data['city'] ?? '');
        $state       = trim($data['state'] ?? '');
        $address     = trim($data['address'] ?? '');
        $about       = trim($data['about'] ?? '');

        if (!$name || !$email || !$phone) {
            jsonResponse(['error' => 'name, email and phone are required'], 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Invalid email address'], 422);
        }

        // Duplicate check
        $s = $db->prepare("SELECT id FROM users WHERE email = ?"); $s->execute([$email]);
        if ($s->fetch()) jsonResponse(['error' => 'An account with this email already exists'], 409);

        // Password: use provided or auto-generate
        $plainPassword = trim($data['password'] ?? '');
        if (!$plainPassword) {
            $plainPassword = substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'), 0, 12);
        }
        $hashed = password_hash($plainPassword, PASSWORD_BCRYPT);

        $stmt = $db->prepare("
            INSERT INTO users (name, email, phone, password, role, company_name, gst, pan, address_street, address_city, address_state, partner_about,
                is_active, is_verified, partner_status, registered_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'partner', ?, ?, ?, ?, ?, ?, ?,
                1, 1, 'approved', CURDATE(), NOW(), NOW())
        ");
        $stmt->execute([$name, $email, $phone, $hashed, $companyName, $gst, $pan, $address, $city, $state, $about]);
        $partnerId = (int)$db->lastInsertId();

        self::auditLog($db, $partnerId, $user['id'], 'admin_created', 'partner', $partnerId, 'Partner created directly by admin');

        // Send credentials email
        try { Mailer::sendPartnerCredentialsEmail($email, $name, $email, $plainPassword); } catch (Throwable $e) {}

        // Bulk rate card assignment if provided
        $rateCards = $data['rateCards'] ?? [];
        $createdRCs = [];
        foreach ($rateCards as $rc) {
            $svcId       = (int)($rc['serviceId'] ?? 0);
            $partnerPrice = (float)($rc['partnerPrice'] ?? 0);
            $basePrice   = (float)($rc['basePrice'] ?? 0);
            if (!$svcId || !$partnerPrice) continue;
            $marginPercent = ($basePrice > 0) ? round((($basePrice - $partnerPrice) / $basePrice) * 100, 2) : null;
            $ins = $db->prepare("
                INSERT INTO partner_rate_cards (partner_id, service_id, base_price, partner_price, margin_percent, effective_date, status, created_by)
                VALUES (?, ?, ?, ?, ?, CURDATE(), 'rate_pending_approval', ?)
            ");
            $ins->execute([$partnerId, $svcId, $basePrice, $partnerPrice, $marginPercent, $user['id']]);
            $rcId = (int)$db->lastInsertId();
            self::auditLog($db, $partnerId, $user['id'], 'rate_card_created', 'rate_card', $rcId, "Rate card for service $svcId");
            $createdRCs[] = $rcId;
        }

        $partner = self::fetchPartner($db, $partnerId);
        jsonResponse(['success' => true, 'partner' => $partner, 'rateCardsCreated' => count($createdRCs), 'plainPassword' => $plainPassword], 201);
    }

    // POST /api/admin/partners/:id/bulk-rate-cards — assign/update multiple rate cards at once
    public static function bulkAssignRateCards($partnerId) {
        $user = Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $s = $db->prepare("SELECT id, name, email FROM users WHERE id = ? AND role = 'partner'");
        $s->execute([$partnerId]); $partner = $s->fetch();
        if (!$partner) jsonResponse(['error' => 'Partner not found'], 404);

        $rateCards = $data['rateCards'] ?? [];
        if (empty($rateCards)) jsonResponse(['error' => 'rateCards array is required'], 422);

        $created = 0; $updated = 0;
        foreach ($rateCards as $rc) {
            $svcId        = (int)($rc['serviceId'] ?? 0);
            $partnerPrice = (float)($rc['partnerPrice'] ?? 0);
            $basePrice    = (float)($rc['basePrice'] ?? 0);
            if (!$svcId || !$partnerPrice) continue;

            $marginPercent = ($basePrice > 0) ? round((($basePrice - $partnerPrice) / $basePrice) * 100, 2) : null;

            // Upsert: update existing active rate card or create new
            $existing = $db->prepare("SELECT id FROM partner_rate_cards WHERE partner_id = ? AND service_id = ? AND status != 'rate_rejected' ORDER BY created_at DESC LIMIT 1");
            $existing->execute([$partnerId, $svcId]); $ex = $existing->fetch();

            if ($ex) {
                $db->prepare("UPDATE partner_rate_cards SET base_price=?, partner_price=?, margin_percent=?, status='rate_pending_approval', updated_at=NOW() WHERE id=?")
                    ->execute([$basePrice, $partnerPrice, $marginPercent, $ex['id']]);
                self::auditLog($db, $partnerId, $user['id'], 'rate_card_updated', 'rate_card', $ex['id'], "Bulk update service $svcId");
                $updated++;
            } else {
                $ins = $db->prepare("INSERT INTO partner_rate_cards (partner_id, service_id, base_price, partner_price, margin_percent, effective_date, status, created_by) VALUES (?,?,?,?,?,CURDATE(),'rate_pending_approval',?)");
                $ins->execute([$partnerId, $svcId, $basePrice, $partnerPrice, $marginPercent, $user['id']]);
                $rcId = (int)$db->lastInsertId();
                self::auditLog($db, $partnerId, $user['id'], 'rate_card_created', 'rate_card', $rcId, "Bulk assign service $svcId");
                $created++;
            }
        }

        // Notify partner
        try { Mailer::sendRateCardBulkAssignedEmail($partner['email'], $partner['name'], $created + $updated); } catch (Throwable $e) {}

        jsonResponse(['success' => true, 'created' => $created, 'updated' => $updated]);
    }

    // ===== HELPER =====
    private static function fetchPartner($db, $id) {
        $s = $db->prepare("SELECT u.*, r.name AS reviewer_name FROM users u LEFT JOIN users r ON r.id = u.partner_assigned_reviewer WHERE u.id = ? AND u.role = 'partner'");
        $s->execute([$id]);
        $p = $s->fetch();
        if (!$p) return null;
        return formatPartner($p);
    }

    public static function auditLog($db, $partnerId, $userId, $action, $entity = null, $entityId = null, $comments = null) {
        try {
            $db->prepare("INSERT INTO partner_audit_logs (partner_id, user_id, action, entity, entity_id, comments) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute([$partnerId, $userId, $action, $entity, $entityId, $comments]);
        } catch (Throwable $e) {}
    }
}
