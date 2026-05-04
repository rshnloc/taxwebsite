<?php
class RateCardController {

    // POST /api/rate-cards — admin only
    public static function create() {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();

        $partnerId     = (int)($data['partnerId'] ?? 0);
        $serviceId     = (int)($data['serviceId'] ?? 0);
        $basePrice     = (float)($data['basePrice'] ?? 0);
        $partnerPrice  = (float)($data['partnerPrice'] ?? 0);
        $commission    = isset($data['commission']) ? (float)$data['commission'] : null;
        $marginPercent = isset($data['marginPercent']) ? (float)$data['marginPercent'] : null;
        $effectiveDate = $data['effectiveDate'] ?? date('Y-m-d');
        $expiryDate    = $data['expiryDate'] ?? null;
        $notes         = trim($data['notes'] ?? '');

        if (!$partnerId || !$serviceId || !$partnerPrice) {
            jsonResponse(['error' => 'partnerId, serviceId, and partnerPrice are required'], 422);
        }
        // Validate partner
        $s = $db->prepare("SELECT id, name, email, partner_status FROM users WHERE id = ? AND role = 'partner'");
        $s->execute([$partnerId]); $partner = $s->fetch();
        if (!$partner) jsonResponse(['error' => 'Partner not found'], 404);

        // Compute margin if not provided
        if ($marginPercent === null && $basePrice > 0) {
            $marginPercent = round((($basePrice - $partnerPrice) / $basePrice) * 100, 2);
        }

        $stmt = $db->prepare("
            INSERT INTO partner_rate_cards (partner_id, service_id, base_price, partner_price, commission, margin_percent,
                effective_date, expiry_date, notes, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'rate_pending_approval', ?)
        ");
        $stmt->execute([$partnerId, $serviceId, $basePrice, $partnerPrice, $commission, $marginPercent, $effectiveDate, $expiryDate, $notes, $user['id']]);
        $rcId = (int)$db->lastInsertId();

        PartnerController::auditLog($db, $partnerId, $user['id'], 'rate_card_created', 'rate_card', $rcId, "Rate card created for service $serviceId");

        // Notify partner
        try {
            $svc = $db->prepare("SELECT name FROM services WHERE id = ?"); $svc->execute([$serviceId]);
            $svcName = $svc->fetchColumn() ?: "Service #$serviceId";
            Mailer::sendRateCardCreatedEmail($partner['email'], $partner['name'], $svcName, $partnerPrice);
        } catch (Throwable $e) {}

        $rc = self::fetchRateCard($db, $rcId);
        jsonResponse(['success' => true, 'rateCard' => $rc], 201);
    }

    // GET /api/rate-cards — admin (all) or partner (own)
    public static function getAll() {
        $user = Auth::protect();
        $db   = getDb();

        $partnerId = $_GET['partnerId'] ?? null;
        $status    = $_GET['status'] ?? '';

        if ($user['role'] === 'partner') {
            $partnerId = $user['id'];
        } elseif (!in_array($user['role'], ['admin','employee'])) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }

        $where = []; $params = [];
        if ($partnerId) { $where[] = "rc.partner_id = ?"; $params[] = $partnerId; }
        if ($status)    { $where[] = "rc.status = ?"; $params[] = $status; }

        $whereStr = $where ? "WHERE " . implode(' AND ', $where) : '';
        $stmt = $db->prepare("SELECT rc.* FROM partner_rate_cards rc $whereStr ORDER BY rc.created_at DESC");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $cards = array_map(fn($r) => self::fetchRateCard($db, $r['id']), $rows);
        jsonResponse(['rateCards' => $cards]);
    }

    // GET /api/rate-cards/:id
    public static function getById($id) {
        $user = Auth::protect();
        $db   = getDb();
        $rc   = self::fetchRateCard($db, $id);
        if (!$rc) jsonResponse(['error' => 'Rate card not found'], 404);

        // Access control
        if ($user['role'] === 'partner' && $rc['partnerId'] !== $user['id']) jsonResponse(['error' => 'Forbidden'], 403);
        if (!in_array($user['role'], ['admin','employee','partner'])) jsonResponse(['error' => 'Forbidden'], 403);

        // Load history
        $hist = $db->prepare("SELECT h.*, u.name AS by_name FROM partner_rate_card_history h LEFT JOIN users u ON h.changed_by = u.id WHERE h.rate_card_id = ? ORDER BY h.created_at DESC");
        $hist->execute([$id]);
        $rc['history'] = $hist->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['rateCard' => $rc]);
    }

    // PUT /api/rate-cards/:id — admin only (update price/dates)
    public static function update($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();

        $s = $db->prepare("SELECT * FROM partner_rate_cards WHERE id = ?"); $s->execute([$id]);
        $old = $s->fetch();
        if (!$old) jsonResponse(['error' => 'Rate card not found'], 404);

        $fields = ['base_price','partner_price','commission','margin_percent','effective_date','expiry_date','notes'];
        $sets = []; $vals = [];
        $keyMap = ['base_price'=>'basePrice','partner_price'=>'partnerPrice','commission'=>'commission','margin_percent'=>'marginPercent','effective_date'=>'effectiveDate','expiry_date'=>'expiryDate','notes'=>'notes'];
        foreach ($fields as $col) {
            $k = $keyMap[$col];
            if (array_key_exists($k, $data)) { $sets[] = "$col = ?"; $vals[] = $data[$k]; }
        }
        if (empty($sets)) jsonResponse(['error' => 'No fields to update'], 422);

        // Save history
        $oldData = json_encode($old);
        $vals[] = $id;
        $db->prepare("UPDATE partner_rate_cards SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = ?")->execute($vals);

        $newRow = $db->prepare("SELECT * FROM partner_rate_cards WHERE id = ?"); $newRow->execute([$id]); $newData = json_encode($newRow->fetch());
        $db->prepare("INSERT INTO partner_rate_card_history (rate_card_id, changed_by, old_data, new_data) VALUES (?, ?, ?, ?)")
            ->execute([$id, $user['id'], $oldData, $newData]);

        PartnerController::auditLog($db, $old['partner_id'], $user['id'], 'rate_card_updated', 'rate_card', $id, 'Rate card updated');

        $rc = self::fetchRateCard($db, $id);
        jsonResponse(['success' => true, 'rateCard' => $rc]);
    }

    // PUT /api/rate-cards/:id/admin-status — admin: approve or reject rate card
    public static function adminUpdateStatus($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();

        $status   = $data['status'] ?? '';
        $comments = trim($data['comments'] ?? '');

        if (!in_array($status, ['rate_approved','rate_rejected','rate_pending_approval'])) {
            jsonResponse(['error' => 'Invalid status'], 422);
        }

        $s = $db->prepare("SELECT * FROM partner_rate_cards WHERE id = ?"); $s->execute([$id]);
        $rc = $s->fetch();
        if (!$rc) jsonResponse(['error' => 'Rate card not found'], 404);

        $db->prepare("UPDATE partner_rate_cards SET status = ?, updated_at = NOW() WHERE id = ?")->execute([$status, $id]);
        PartnerController::auditLog($db, $rc['partner_id'], $user['id'], "rate_card_$status", 'rate_card', $id, $comments);

        // Notify partner
        $p = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $p->execute([$rc['partner_id']]); $prt = $p->fetch();
        $svc = $db->prepare("SELECT name FROM services WHERE id = ?"); $svc->execute([$rc['service_id']]); $svcName = $svc->fetchColumn() ?: "Service";
        if ($prt) {
            if ($status === 'rate_approved') {
                try { Mailer::sendRateCardApprovedEmail($prt['email'], $prt['name'], $svcName); } catch (Throwable $e) {}
            } elseif ($status === 'rate_rejected') {
                try { Mailer::sendRateCardRejectedEmail($prt['email'], $prt['name'], $svcName, $comments); } catch (Throwable $e) {}
            }
        }

        jsonResponse(['success' => true, 'rateCard' => self::fetchRateCard($db, $id)]);
    }

    // PUT /api/rate-cards/:id/respond — partner: accept or reject
    public static function partnerRespond($id) {
        $user = Auth::protect();
        if ($user['role'] !== 'partner') jsonResponse(['error' => 'Forbidden'], 403);
        $db   = getDb();
        $data = getJsonInput();

        $action   = $data['action'] ?? ''; // 'accept' or 'reject'
        $feedback = trim($data['feedback'] ?? '');

        if (!in_array($action, ['accept','reject'])) {
            jsonResponse(['error' => 'action must be "accept" or "reject"'], 422);
        }

        $s = $db->prepare("SELECT * FROM partner_rate_cards WHERE id = ? AND partner_id = ?");
        $s->execute([$id, $user['id']]); $rc = $s->fetch();
        if (!$rc) jsonResponse(['error' => 'Rate card not found'], 404);

        $newStatus = $action === 'accept' ? 'rate_approved' : 'rate_rejected';
        $db->prepare("UPDATE partner_rate_cards SET status = ?, partner_feedback = ?, updated_at = NOW() WHERE id = ?")
            ->execute([$newStatus, $feedback, $id]);

        PartnerController::auditLog($db, $user['id'], $user['id'], "partner_$action".'ed_rate_card', 'rate_card', $id, $feedback);

        // Notify admins
        $admins = $db->query("SELECT email, name FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 3")->fetchAll();
        $svc = $db->prepare("SELECT name FROM services WHERE id = ?"); $svc->execute([$rc['service_id']]); $svcName = $svc->fetchColumn();
        foreach ($admins as $admin) {
            try { Mailer::sendRateCardPartnerRespondedEmail($admin['email'], $admin['name'], $user['name'], $svcName, $action); } catch (Throwable $e) {}
        }

        jsonResponse(['success' => true, 'rateCard' => self::fetchRateCard($db, $id)]);
    }

    // DELETE /api/rate-cards/:id — admin only
    public static function delete($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db = getDb();
        $s = $db->prepare("SELECT * FROM partner_rate_cards WHERE id = ?"); $s->execute([$id]); $rc = $s->fetch();
        if (!$rc) jsonResponse(['error' => 'Rate card not found'], 404);
        $db->prepare("DELETE FROM partner_rate_cards WHERE id = ?")->execute([$id]);
        PartnerController::auditLog($db, $rc['partner_id'], $user['id'], 'rate_card_deleted', 'rate_card', $id);
        jsonResponse(['success' => true]);
    }

    // ===== HELPER =====
    private static function fetchRateCard($db, $id) {
        $s = $db->prepare("
            SELECT rc.*, s.name AS service_name, s.slug AS service_slug,
                   u.name AS partner_name, u.email AS partner_email,
                   cb.name AS created_by_name
            FROM partner_rate_cards rc
            LEFT JOIN services s ON s.id = rc.service_id
            LEFT JOIN users u ON u.id = rc.partner_id
            LEFT JOIN users cb ON cb.id = rc.created_by
            WHERE rc.id = ?
        ");
        $s->execute([$id]); $r = $s->fetch();
        if (!$r) return null;
        return formatRateCard($r);
    }
}
