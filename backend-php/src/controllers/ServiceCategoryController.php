<?php
class ServiceCategoryController {

    private static function format($c) {
        return [
            'id'          => (int)$c['id'],
            'name'        => $c['name'],
            'slug'        => $c['slug'],
            'icon'        => $c['icon'] ?? '📁',
            'description' => $c['description'] ?? '',
            'sortOrder'   => (int)$c['sort_order'],
            'isActive'    => (bool)$c['is_active'],
            'createdAt'   => $c['created_at'],
        ];
    }

    // GET /api/service-categories
    public static function getAll() {
        $db = getDb();
        $activeOnly = ($_GET['active'] ?? '') === 'true';
        $sql = $activeOnly
            ? "SELECT * FROM service_categories WHERE is_active = 1 ORDER BY sort_order, name"
            : "SELECT * FROM service_categories ORDER BY sort_order, name";
        $stmt = $db->query($sql);
        jsonResponse(['categories' => array_map([self::class, 'format'], $stmt->fetchAll())]);
    }

    // POST /api/service-categories
    public static function create() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $name = trim($data['name'] ?? '');
        if (!$name) jsonResponse(['error' => 'Category name is required'], 422);

        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
        $slug = trim($slug, '-');
        // ensure unique slug
        $base = $slug; $c = 2;
        while ($db->query("SELECT id FROM service_categories WHERE slug = '" . addslashes($slug) . "'")->fetch()) {
            $slug = $base . '-' . $c++;
        }

        $db->prepare("INSERT INTO service_categories (name, slug, icon, description, sort_order, is_active) VALUES (?,?,?,?,?,1)")
           ->execute([$name, $slug, $data['icon'] ?? '📁', $data['description'] ?? '', (int)($data['sortOrder'] ?? 0)]);

        $stmt = $db->prepare("SELECT * FROM service_categories WHERE id = ?");
        $stmt->execute([(int)$db->lastInsertId()]);
        jsonResponse(['category' => self::format($stmt->fetch())], 201);
    }

    // PUT /api/service-categories/:id
    public static function update($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $fields = []; $params = [];
        if (isset($data['name']))        { $fields[] = "name = ?";        $params[] = $data['name']; }
        if (isset($data['icon']))        { $fields[] = "icon = ?";        $params[] = $data['icon']; }
        if (isset($data['description'])) { $fields[] = "description = ?"; $params[] = $data['description']; }
        if (isset($data['sortOrder']))   { $fields[] = "sort_order = ?";  $params[] = (int)$data['sortOrder']; }
        if (isset($data['isActive']))    { $fields[] = "is_active = ?";   $params[] = $data['isActive'] ? 1 : 0; }

        if ($fields) {
            $params[] = (int)$id;
            $db->prepare("UPDATE service_categories SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        $stmt = $db->prepare("SELECT * FROM service_categories WHERE id = ?");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) jsonResponse(['error' => 'Category not found'], 404);
        jsonResponse(['category' => self::format($row)]);
    }

    // DELETE /api/service-categories/:id
    public static function delete($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        // Check if any services use this category
        $stmt = $db->prepare("SELECT COUNT(*) FROM services WHERE category = (SELECT slug FROM service_categories WHERE id = ?)");
        $stmt->execute([(int)$id]);
        if ((int)$stmt->fetchColumn() > 0) {
            jsonResponse(['error' => 'Cannot delete — services are using this category. Reassign them first.'], 422);
        }
        $db->prepare("DELETE FROM service_categories WHERE id = ?")->execute([(int)$id]);
        jsonResponse(['message' => 'Category deleted']);
    }
}
