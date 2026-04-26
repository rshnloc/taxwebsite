<?php
class ClientTypeController {

    private static function formatType($t) {
        return [
            'id'             => (int)$t['id'],
            'name'           => $t['name'],
            'slug'           => $t['slug'],
            'description'    => $t['description'],
            'requiredFields' => json_decode($t['required_fields'] ?? '[]', true),
            'isActive'       => (bool)$t['is_active'],
            'createdAt'      => $t['created_at'],
        ];
    }

    // GET /api/client-types
    public static function getClientTypes() {
        $db = getDb();
        $stmt = $db->query("SELECT * FROM client_types ORDER BY name");
        jsonResponse(['clientTypes' => array_map(fn($t) => self::formatType($t), $stmt->fetchAll())]);
    }

    // POST /api/client-types
    public static function createClientType() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $name = trim($data['name'] ?? '');
        if (!$name) jsonResponse(['error' => 'Name is required'], 422);

        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
        $slug = trim($slug, '-');

        $db->prepare("INSERT INTO client_types (name, slug, description, required_fields) VALUES (?,?,?,?)")
           ->execute([
               $name, $slug,
               $data['description'] ?? null,
               isset($data['requiredFields']) ? json_encode($data['requiredFields']) : '[]',
           ]);
        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM client_types WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['clientType' => self::formatType($stmt->fetch())], 201);
    }

    // PUT /api/client-types/:id
    public static function updateClientType($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $stmt = $db->prepare("SELECT * FROM client_types WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Client type not found'], 404);

        $fields = []; $params = [];
        if (isset($data['name'])) {
            $fields[] = "name = ?"; $params[] = $data['name'];
            $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($data['name']));
            $fields[] = "slug = ?"; $params[] = trim($slug, '-');
        }
        if (isset($data['description']))    { $fields[] = "description = ?";     $params[] = $data['description']; }
        if (isset($data['requiredFields'])) { $fields[] = "required_fields = ?"; $params[] = json_encode($data['requiredFields']); }
        if (isset($data['isActive']))       { $fields[] = "is_active = ?";       $params[] = $data['isActive'] ? 1 : 0; }

        if ($fields) {
            $params[] = $id;
            $db->prepare("UPDATE client_types SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        $stmt = $db->prepare("SELECT * FROM client_types WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['clientType' => self::formatType($stmt->fetch())]);
    }

    // DELETE /api/client-types/:id
    public static function deleteClientType($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $db->prepare("UPDATE client_types SET is_active = 0 WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Client type deactivated']);
    }

    // PUT /api/users/:id/client-type
    public static function assignClientType($userId) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $typeId = (int)($data['clientTypeId'] ?? 0);
        $u = $db->prepare("SELECT id FROM users WHERE id = ?");
        $u->execute([$userId]);
        if (!$u->fetch()) jsonResponse(['error' => 'User not found'], 404);

        $db->prepare("UPDATE users SET client_type_id = ? WHERE id = ?")->execute([$typeId ?: null, $userId]);
        jsonResponse(['message' => 'Client type assigned']);
    }
}
