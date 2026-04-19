<?php
/**
 * Helper to format a user row for JSON output (camelCase, nested address)
 */
function formatUser($u) {
    if (!$u) return null;
    return [
        'id' => (int)$u['id'],
        '_id' => (string)$u['id'], // compat with frontend expecting _id
        'name' => $u['name'],
        'email' => $u['email'],
        'phone' => $u['phone'] ?? '',
        'role' => $u['role'],
        'avatar' => $u['avatar'] ?? '',
        'address' => [
            'street' => $u['address_street'] ?? '',
            'city' => $u['address_city'] ?? '',
            'state' => $u['address_state'] ?? '',
            'pincode' => $u['address_pincode'] ?? '',
        ],
        'pan' => $u['pan'] ?? '',
        'gst' => $u['gst'] ?? '',
        'companyName' => $u['company_name'] ?? '',
        'department' => $u['department'] ?? '',
        'designation' => $u['designation'] ?? '',
        'isActive' => (bool)$u['is_active'],
        'isVerified' => (bool)$u['is_verified'],
        'lastLogin' => $u['last_login'] ?? null,
        'createdAt' => $u['created_at'],
        'updatedAt' => $u['updated_at'],
    ];
}

function formatService($s, $db = null) {
    if (!$s) return null;
    $sid = (int)$s['id'];
    $result = [
        'id' => $sid,
        '_id' => (string)$sid,
        'name' => $s['name'],
        'slug' => $s['slug'],
        'shortDescription' => $s['short_description'],
        'description' => $s['description'],
        'icon' => $s['icon'],
        'category' => $s['category'],
        'pricing' => [
            'basePrice' => (float)$s['pricing_base_price'],
            'gstPercent' => (float)$s['pricing_gst_percent'],
            'totalPrice' => (float)$s['pricing_total_price'],
            'isCustom' => (bool)$s['pricing_is_custom'],
            'pricingNote' => $s['pricing_note'] ?? '',
        ],
        'timeline' => $s['timeline'],
        'isActive' => (bool)$s['is_active'],
        'isPopular' => (bool)$s['is_popular'],
        'sortOrder' => (int)$s['sort_order'],
        'createdAt' => $s['created_at'],
        'updatedAt' => $s['updated_at'],
    ];

    if ($db) {
        // Load related data
        $stmt = $db->prepare("SELECT name, description, is_mandatory FROM service_documents WHERE service_id = ?");
        $stmt->execute([$sid]);
        $result['requiredDocuments'] = array_map(fn($d) => [
            'name' => $d['name'], 'description' => $d['description'] ?? '', 'isMandatory' => (bool)$d['is_mandatory']
        ], $stmt->fetchAll());

        $stmt = $db->prepare("SELECT feature FROM service_features WHERE service_id = ?");
        $stmt->execute([$sid]);
        $result['features'] = array_column($stmt->fetchAll(), 'feature');

        $stmt = $db->prepare("SELECT step, title, description FROM service_process WHERE service_id = ? ORDER BY step");
        $stmt->execute([$sid]);
        $result['process'] = array_map(fn($p) => [
            'step' => (int)$p['step'], 'title' => $p['title'], 'description' => $p['description']
        ], $stmt->fetchAll());

        $stmt = $db->prepare("SELECT question, answer FROM service_faqs WHERE service_id = ?");
        $stmt->execute([$sid]);
        $result['faqs'] = $stmt->fetchAll();
    }

    return $result;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function getDb() {
    return Database::getInstance()->getConnection();
}
