<?php
class ServiceController {

    // GET /api/services
    public static function getServices() {
        $db = getDb();
        $category = $_GET['category'] ?? '';
        $search = $_GET['search'] ?? '';
        $active = $_GET['active'] ?? 'true';

        $where = []; $params = [];
        if ($category) { $where[] = "category = ?"; $params[] = $category; }
        if ($active !== '') { $where[] = "is_active = ?"; $params[] = $active === 'true' ? 1 : 0; }
        if ($search) { $where[] = "(name LIKE ? OR description LIKE ?)"; $like = "%$search%"; $params[] = $like; $params[] = $like; }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $stmt = $db->prepare("SELECT * FROM services $whereSQL ORDER BY sort_order, name");
        $stmt->execute($params);
        $services = array_map(fn($s) => formatService($s, $db), $stmt->fetchAll());
        jsonResponse(['services' => $services]);
    }

    // GET /api/services/:slug
    public static function getServiceBySlug($slug) {
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM services WHERE slug = ? AND is_active = 1");
        $stmt->execute([$slug]);
        $service = $stmt->fetch();
        if (!$service) jsonResponse(['error' => 'Service not found'], 404);
        jsonResponse(['service' => formatService($service, $db)]);
    }

    // POST /api/services
    public static function createService() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $name = $data['name'] ?? '';
        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
        $slug = trim($slug, '-');

        $stmt = $db->prepare("INSERT INTO services (name, slug, short_description, description, icon, category, pricing_base_price, pricing_gst_percent, pricing_total_price, pricing_is_custom, pricing_note, timeline, is_popular, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $pricing = $data['pricing'] ?? [];
        $stmt->execute([
            $name, $slug,
            $data['shortDescription'] ?? '', $data['description'] ?? '',
            $data['icon'] ?? 'FileText', $data['category'] ?? 'other',
            $pricing['basePrice'] ?? 0, $pricing['gstPercent'] ?? 18, $pricing['totalPrice'] ?? 0,
            ($pricing['isCustom'] ?? false) ? 1 : 0, $pricing['pricingNote'] ?? null,
            $data['timeline'] ?? '7-10 working days',
            ($data['isPopular'] ?? false) ? 1 : 0, $data['sortOrder'] ?? 0,
        ]);
        $id = (int)$db->lastInsertId();

        self::saveRelated($db, $id, $data);

        $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['service' => formatService($stmt->fetch(), $db)], 201);
    }

    // PUT /api/services/:id
    public static function updateService($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $fields = []; $params = [];
        if (isset($data['name'])) {
            $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($data['name']));
            $fields[] = "name = ?"; $params[] = $data['name'];
            $fields[] = "slug = ?"; $params[] = trim($slug, '-');
        }
        foreach (['shortDescription' => 'short_description', 'description' => 'description', 'icon' => 'icon', 'category' => 'category', 'timeline' => 'timeline'] as $key => $col) {
            if (isset($data[$key])) { $fields[] = "$col = ?"; $params[] = $data[$key]; }
        }
        if (isset($data['isPopular'])) { $fields[] = "is_popular = ?"; $params[] = $data['isPopular'] ? 1 : 0; }
        if (isset($data['isActive'])) { $fields[] = "is_active = ?"; $params[] = $data['isActive'] ? 1 : 0; }
        if (isset($data['sortOrder'])) { $fields[] = "sort_order = ?"; $params[] = $data['sortOrder']; }
        if (isset($data['pricing'])) {
            $p = $data['pricing'];
            if (isset($p['basePrice'])) { $fields[] = "pricing_base_price = ?"; $params[] = $p['basePrice']; }
            if (isset($p['gstPercent'])) { $fields[] = "pricing_gst_percent = ?"; $params[] = $p['gstPercent']; }
            if (isset($p['totalPrice'])) { $fields[] = "pricing_total_price = ?"; $params[] = $p['totalPrice']; }
            if (isset($p['isCustom'])) { $fields[] = "pricing_is_custom = ?"; $params[] = $p['isCustom'] ? 1 : 0; }
            if (isset($p['pricingNote'])) { $fields[] = "pricing_note = ?"; $params[] = $p['pricingNote']; }
        }

        if ($fields) {
            $params[] = $id;
            $db->prepare("UPDATE services SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        if (isset($data['requiredDocuments']) || isset($data['features']) || isset($data['process']) || isset($data['faqs'])) {
            self::saveRelated($db, $id, $data);
        }

        $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
        $stmt->execute([$id]);
        $s = $stmt->fetch();
        if (!$s) jsonResponse(['error' => 'Service not found'], 404);
        jsonResponse(['service' => formatService($s, $db)]);
    }

    // DELETE /api/services/:id (soft)
    public static function deleteService($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $db->prepare("UPDATE services SET is_active = 0 WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Service deactivated']);
    }

    private static function saveRelated($db, $serviceId, $data) {
        if (isset($data['requiredDocuments'])) {
            $db->prepare("DELETE FROM service_documents WHERE service_id = ?")->execute([$serviceId]);
            $stmt = $db->prepare("INSERT INTO service_documents (service_id, name, description, is_mandatory) VALUES (?,?,?,?)");
            foreach ($data['requiredDocuments'] as $d) {
                $stmt->execute([$serviceId, $d['name'], $d['description'] ?? null, ($d['isMandatory'] ?? true) ? 1 : 0]);
            }
        }
        if (isset($data['features'])) {
            $db->prepare("DELETE FROM service_features WHERE service_id = ?")->execute([$serviceId]);
            $stmt = $db->prepare("INSERT INTO service_features (service_id, feature) VALUES (?,?)");
            foreach ($data['features'] as $f) { $stmt->execute([$serviceId, $f]); }
        }
        if (isset($data['process'])) {
            $db->prepare("DELETE FROM service_process WHERE service_id = ?")->execute([$serviceId]);
            $stmt = $db->prepare("INSERT INTO service_process (service_id, step, title, description) VALUES (?,?,?,?)");
            foreach ($data['process'] as $p) { $stmt->execute([$serviceId, $p['step'], $p['title'], $p['description'] ?? '']); }
        }
        if (isset($data['faqs'])) {
            $db->prepare("DELETE FROM service_faqs WHERE service_id = ?")->execute([$serviceId]);
            $stmt = $db->prepare("INSERT INTO service_faqs (service_id, question, answer) VALUES (?,?,?)");
            foreach ($data['faqs'] as $f) { $stmt->execute([$serviceId, $f['question'], $f['answer']]); }
        }
    }
}
