<?php
class DocumentFieldTypeController {

    // GET /api/document-field-types
    public static function getAll() {
        $db = getDb();
        $activeOnly = ($_GET['active'] ?? 'true') === 'true';
        $sql = "SELECT * FROM document_field_types" . ($activeOnly ? " WHERE is_active = 1" : "") . " ORDER BY sort_order, name";
        $stmt = $db->query($sql);
        $rows = $stmt->fetchAll();
        $types = array_map(fn($r) => self::format($r), $rows);
        jsonResponse(['fieldTypes' => $types]);
    }

    // POST /api/document-field-types
    public static function create() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');
        if ($name === '') jsonResponse(['error' => 'Name is required'], 422);

        $db = getDb();
        $stmt = $db->prepare("INSERT INTO document_field_types (name, description, icon, is_active, sort_order) VALUES (?,?,?,?,?)");
        $stmt->execute([
            $name,
            trim($data['description'] ?? ''),
            $data['icon'] ?? '📄',
            isset($data['isActive']) ? ((bool)$data['isActive'] ? 1 : 0) : 1,
            (int)($data['sortOrder'] ?? 0),
        ]);
        $id = $db->lastInsertId();
        $row = $db->query("SELECT * FROM document_field_types WHERE id = $id")->fetch();
        jsonResponse(['fieldType' => self::format($row)], 201);
    }

    // PUT /api/document-field-types/:id
    public static function update($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $row = $db->query("SELECT * FROM document_field_types WHERE id = " . (int)$id)->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);

        $name        = trim($data['name']        ?? $row['name']);
        $description = trim($data['description'] ?? $row['description'] ?? '');
        $icon        = $data['icon']        ?? $row['icon']        ?? '📄';
        $isActive    = isset($data['isActive'])   ? ((bool)$data['isActive'] ? 1 : 0) : $row['is_active'];
        $sortOrder   = isset($data['sortOrder'])  ? (int)$data['sortOrder']  : $row['sort_order'];

        $stmt = $db->prepare("UPDATE document_field_types SET name=?, description=?, icon=?, is_active=?, sort_order=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$name, $description, $icon, $isActive, $sortOrder, (int)$id]);

        $row = $db->query("SELECT * FROM document_field_types WHERE id = " . (int)$id)->fetch();
        jsonResponse(['fieldType' => self::format($row)]);
    }

    // DELETE /api/document-field-types/:id
    public static function delete($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("DELETE FROM document_field_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        jsonResponse(['success' => true]);
    }

    private static function format($r) {
        return [
            'id'          => (int)$r['id'],
            'name'        => $r['name'],
            'description' => $r['description'] ?? '',
            'icon'        => $r['icon'] ?? '📄',
            'isActive'    => (bool)$r['is_active'],
            'sortOrder'   => (int)$r['sort_order'],
            'createdAt'   => $r['created_at'],
        ];
    }
}
