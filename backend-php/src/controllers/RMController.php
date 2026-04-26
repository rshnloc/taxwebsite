<?php
class RMController {

    private static function formatAssignment($a, $db) {
        // RM details
        $rm = $db->prepare("SELECT id, name, email, phone, designation FROM users WHERE id = ?");
        $rm->execute([$a['rm_user_id']]);
        $rmUser = $rm->fetch();

        // Client details
        $clientUser = null;
        if ($a['client_user_id']) {
            $c = $db->prepare("SELECT id, name, email, phone, company_name, client_type_id FROM users WHERE id = ?");
            $c->execute([$a['client_user_id']]);
            $clientUser = $c->fetch();
        }

        return [
            'id'          => (int)$a['id'],
            'rm'          => $rmUser ? [
                'id'          => (int)$rmUser['id'],
                'name'        => $rmUser['name'],
                'email'       => $rmUser['email'],
                'phone'       => $rmUser['phone'],
                'designation' => $rmUser['designation'],
            ] : null,
            'client'      => $clientUser ? [
                'id'          => (int)$clientUser['id'],
                'name'        => $clientUser['name'],
                'email'       => $clientUser['email'],
                'phone'       => $clientUser['phone'],
                'companyName' => $clientUser['company_name'],
            ] : null,
            'companyName' => $a['company_name'],
            'notes'       => $a['notes'],
            'isActive'    => (bool)$a['is_active'],
            'assignedAt'  => $a['assigned_at'],
            'unassignedAt'=> $a['unassigned_at'],
        ];
    }

    // GET /api/rm/assignments  (admin or RM views own)
    public static function getAssignments() {
        $user = Auth::protect();
        $db   = getDb();

        if ($user['role'] === 'admin') {
            $stmt = $db->query("SELECT * FROM rm_assignments ORDER BY assigned_at DESC");
        } else {
            $stmt = $db->prepare("SELECT * FROM rm_assignments WHERE rm_user_id = ? ORDER BY assigned_at DESC");
            $stmt->execute([$user['id']]);
        }

        $assignments = array_map(fn($a) => self::formatAssignment($a, $db), $stmt->fetchAll());
        jsonResponse(['assignments' => $assignments]);
    }

    // GET /api/rm/my-clients  — RM sees only their clients
    public static function getMyClients() {
        $user = Auth::protect();
        $db   = getDb();

        $stmt = $db->prepare("
            SELECT u.id, u.name, u.email, u.phone, u.company_name, u.client_type_id,
                   rma.assigned_at, rma.notes
            FROM rm_assignments rma
            JOIN users u ON u.id = rma.client_user_id
            WHERE rma.rm_user_id = ? AND rma.is_active = 1
            ORDER BY u.name
        ");
        $stmt->execute([$user['id']]);
        jsonResponse(['clients' => $stmt->fetchAll()]);
    }

    // POST /api/rm/assignments — assign RM to client
    public static function assignRM() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $rmId     = (int)($data['rmUserId'] ?? 0);
        $clientId = (int)($data['clientUserId'] ?? 0);

        if (!$rmId) jsonResponse(['error' => 'rmUserId is required'], 422);
        if (!$clientId && empty($data['companyName'])) {
            jsonResponse(['error' => 'Either clientUserId or companyName is required'], 422);
        }

        // Deactivate any existing active assignment for this client
        if ($clientId) {
            $db->prepare("UPDATE rm_assignments SET is_active = 0, unassigned_at = NOW() WHERE client_user_id = ? AND is_active = 1")
               ->execute([$clientId]);
        }

        $db->prepare("INSERT INTO rm_assignments (rm_user_id, client_user_id, company_name, notes, assigned_by) VALUES (?,?,?,?,?)")
           ->execute([$rmId, $clientId ?: null, $data['companyName'] ?? null, $data['notes'] ?? null, Auth::userId()]);

        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM rm_assignments WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['assignment' => self::formatAssignment($stmt->fetch(), $db)], 201);
    }

    // PUT /api/rm/assignments/:id — update notes
    public static function updateAssignment($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $stmt = $db->prepare("SELECT * FROM rm_assignments WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Assignment not found'], 404);

        $fields = []; $params = [];
        if (isset($data['notes']))    { $fields[] = "notes = ?";    $params[] = $data['notes']; }
        if (isset($data['isActive'])) { $fields[] = "is_active = ?"; $params[] = $data['isActive'] ? 1 : 0;
            if (!$data['isActive']) { $fields[] = "unassigned_at = NOW()"; }
        }
        if ($fields) {
            $params[] = $id;
            $db->prepare("UPDATE rm_assignments SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        $stmt = $db->prepare("SELECT * FROM rm_assignments WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['assignment' => self::formatAssignment($stmt->fetch(), $db)]);
    }

    // DELETE /api/rm/assignments/:id — unassign
    public static function unassignRM($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $db->prepare("UPDATE rm_assignments SET is_active = 0, unassigned_at = NOW() WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'RM unassigned successfully']);
    }

    // GET /api/rm/list — get all users who can be RMs (admin + employee)
    public static function getRMList() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->query("SELECT id, name, email, phone, designation FROM users WHERE role IN ('admin','employee') AND is_active = 1 ORDER BY name");
        jsonResponse(['rms' => $stmt->fetchAll()]);
    }
}
