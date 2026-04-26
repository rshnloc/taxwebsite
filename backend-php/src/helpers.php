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
    $pricing = normalizeServicePricing([
        'basePrice' => $s['pricing_base_price'] ?? 0,
        'gstPercent' => $s['pricing_gst_percent'] ?? 18,
        'totalPrice' => $s['pricing_total_price'] ?? 0,
        'isCustom' => $s['pricing_is_custom'] ?? 0,
        'pricingNote' => $s['pricing_note'] ?? '',
    ]);
    $result = [
        'id' => $sid,
        '_id' => (string)$sid,
        'name' => $s['name'],
        'slug' => $s['slug'],
        'shortDescription' => $s['short_description'],
        'description' => $s['description'],
        'icon' => $s['icon'],
        'category' => $s['category'],
        'pricing' => $pricing,
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
            'name' => $d['name'],
            'description' => $d['description'] ?? '',
            'isMandatory' => (bool)$d['is_mandatory'],
            'type' => (bool)$d['is_mandatory'] ? 'required' : 'optional',
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

        $result['dynamicFields'] = loadServiceDynamicFields($db, $sid);
        $result['serviceConfig'] = [
            'documents' => $result['requiredDocuments'],
            'dynamicFields' => $result['dynamicFields'],
            'pricing' => $pricing,
        ];
    }

    return $result;
}

function normalizeServicePricing($pricing) {
    $basePrice = isset($pricing['basePrice']) ? (float)$pricing['basePrice'] : (isset($pricing['startingAt']) ? (float)$pricing['startingAt'] : 0);
    $gstPercent = isset($pricing['gstPercent']) ? (float)$pricing['gstPercent'] : 18.0;
    $isCustom = filter_var($pricing['isCustom'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $pricingNote = trim((string)($pricing['pricingNote'] ?? ''));
    $gstIncluded = filter_var($pricing['gstIncluded'] ?? false, FILTER_VALIDATE_BOOLEAN);

    if ($basePrice < 0) {
        throw new InvalidArgumentException('Base price cannot be negative');
    }
    if ($gstPercent < 0 || $gstPercent > 100) {
        throw new InvalidArgumentException('GST percent must be between 0 and 100');
    }

    $computedTotal = $isCustom ? 0 : ($gstIncluded ? $basePrice : round($basePrice + (($basePrice * $gstPercent) / 100), 2));
    $totalPrice = isset($pricing['totalPrice']) && $pricing['totalPrice'] !== ''
        ? (float)$pricing['totalPrice']
        : $computedTotal;

    if (!$isCustom && $basePrice > 0 && $totalPrice <= 0) {
        $totalPrice = $computedTotal;
    }

    return [
        'basePrice' => round($basePrice, 2),
        'startingAt' => round($basePrice, 2),
        'gstPercent' => round($gstPercent, 2),
        'totalPrice' => round($totalPrice, 2),
        'isCustom' => $isCustom,
        'pricingNote' => $pricingNote,
        'gstIncluded' => !$isCustom && $basePrice > 0 ? round($totalPrice, 2) <= round($basePrice, 2) : false,
    ];
}

function validatePasswordStrength($password) {
    if (strlen($password) < 8) return 'Password must be at least 8 characters';
    if (!preg_match('/[A-Z]/', $password)) return 'Password must include at least one uppercase letter';
    if (!preg_match('/[a-z]/', $password)) return 'Password must include at least one lowercase letter';
    if (!preg_match('/\d/', $password)) return 'Password must include at least one number';
    return null;
}

function appLog($level, $message, $context = []) {
    $config = require __DIR__ . '/../config.php';
    $logFile = $config['LOG_PATH'] ?? (__DIR__ . '/../logs/app.log');
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $entry = [
        'timestamp' => date('c'),
        'level' => strtoupper($level),
        'message' => $message,
        'context' => $context,
    ];

    file_put_contents($logFile, json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL, FILE_APPEND);
}

function loadServiceDynamicFields($db, $serviceId) {
    $stmt = $db->prepare("SELECT * FROM service_form_fields WHERE service_id = ? AND is_active = 1 ORDER BY sort_order, id");
    $stmt->execute([$serviceId]);
    $fields = $stmt->fetchAll();
    if (!$fields) {
        return [];
    }

    $fieldIds = array_column($fields, 'id');
    $optionsByField = [];
    if ($fieldIds) {
        $placeholders = implode(',', array_fill(0, count($fieldIds), '?'));
        $optStmt = $db->prepare("SELECT field_id, option_value, option_label, sort_order FROM service_form_field_options WHERE field_id IN ($placeholders) ORDER BY sort_order, id");
        $optStmt->execute($fieldIds);
        foreach ($optStmt->fetchAll() as $option) {
            $optionsByField[$option['field_id']][] = [
                'value' => $option['option_value'],
                'label' => $option['option_label'],
                'sortOrder' => (int)$option['sort_order'],
            ];
        }
    }

    return array_map(function ($field) use ($optionsByField) {
        return [
            'id' => (int)$field['id'],
            '_id' => (string)$field['id'],
            'fieldKey' => $field['field_key'],
            'label' => $field['label'],
            'type' => $field['field_type'],
            'placeholder' => $field['placeholder'] ?? '',
            'helpText' => $field['help_text'] ?? '',
            'isRequired' => (bool)$field['is_required'],
            'sortOrder' => (int)$field['sort_order'],
            'defaultValue' => $field['default_value'],
            'validation' => json_decode($field['validation_rules'] ?? '{}', true) ?: new stdClass(),
            'options' => $optionsByField[$field['id']] ?? [],
        ];
    }, $fields);
}

function validateDynamicFieldsDefinition($dynamicFields) {
    $allowedTypes = ['text', 'textarea', 'number', 'email', 'phone', 'select', 'radio', 'checkbox', 'date', 'file'];
    foreach ($dynamicFields as $index => $field) {
        if (empty($field['fieldKey']) || !preg_match('/^[a-zA-Z][a-zA-Z0-9_]*$/', $field['fieldKey'])) {
            throw new InvalidArgumentException("Dynamic field #" . ($index + 1) . " needs a valid fieldKey");
        }
        if (empty($field['label'])) {
            throw new InvalidArgumentException("Dynamic field '{$field['fieldKey']}' needs a label");
        }
        if (empty($field['type']) || !in_array($field['type'], $allowedTypes, true)) {
            throw new InvalidArgumentException("Dynamic field '{$field['fieldKey']}' has unsupported type");
        }
        if (in_array($field['type'], ['select', 'radio'], true) && empty($field['options'])) {
            throw new InvalidArgumentException("Dynamic field '{$field['fieldKey']}' needs options");
        }
    }
}

function validateApplicationFormData($db, $serviceId, $formData) {
    $fields = loadServiceDynamicFields($db, $serviceId);
    $validated = [];

    foreach ($fields as $field) {
        $value = $formData[$field['fieldKey']] ?? null;
        if ($field['isRequired'] && ($value === null || $value === '' || $value === [])) {
            throw new InvalidArgumentException("{$field['label']} is required");
        }

        if ($value === null || $value === '') {
            continue;
        }

        switch ($field['type']) {
            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    throw new InvalidArgumentException("{$field['label']} must be a valid email");
                }
                break;
            case 'number':
                if (!is_numeric($value)) {
                    throw new InvalidArgumentException("{$field['label']} must be numeric");
                }
                break;
            case 'select':
            case 'radio':
                $allowed = array_column($field['options'], 'value');
                if (!in_array((string)$value, array_map('strval', $allowed), true)) {
                    throw new InvalidArgumentException("{$field['label']} has an invalid value");
                }
                break;
        }

        $validated[] = [
            'fieldId' => $field['id'],
            'fieldKey' => $field['fieldKey'],
            'fieldLabel' => $field['label'],
            'valueText' => is_scalar($value) ? (string)$value : null,
            'valueJson' => is_scalar($value) ? null : json_encode($value),
        ];
    }

    return $validated;
}

function saveApplicationFieldValues($db, $applicationId, $fieldValues) {
    $db->prepare("DELETE FROM application_form_values WHERE application_id = ?")->execute([$applicationId]);
    if (!$fieldValues) {
        return;
    }

    $stmt = $db->prepare("INSERT INTO application_form_values (application_id, field_id, field_key, field_label, value_text, value_json) VALUES (?,?,?,?,?,?)");
    foreach ($fieldValues as $fieldValue) {
        $stmt->execute([
            $applicationId,
            $fieldValue['fieldId'],
            $fieldValue['fieldKey'],
            $fieldValue['fieldLabel'],
            $fieldValue['valueText'],
            $fieldValue['valueJson'],
        ]);
    }
}

function createNotification($db, $userId, $title, $message, $type = 'info', $link = null, $channel = 'in_app', $payload = null) {
    $stmt = $db->prepare("INSERT INTO notifications (user_id, title, message, type, link, channel, payload) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$userId, $title, $message, $type, $link, $channel, $payload ? json_encode($payload) : null]);
    return (int)$db->lastInsertId();
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
