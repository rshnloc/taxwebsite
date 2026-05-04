<?php
class PaymentAccountController {

    // GET /api/admin/payment-accounts
    public static function getAll() {
        Auth::protect();
        Auth::authorize('admin');
        $db = getDb();
        $type = $_GET['type'] ?? '';
        $sql  = "SELECT * FROM payment_accounts WHERE is_active = 1";
        $params = [];
        if ($type) { $sql .= " AND type = ?"; $params[] = $type; }
        $sql .= " ORDER BY is_default DESC, id ASC";
        $stmt = $db->prepare($sql); $stmt->execute($params);
        $rows = $stmt->fetchAll();
        jsonResponse(['accounts' => array_map([self::class, 'format'], $rows)]);
    }

    // POST /api/admin/payment-accounts — multipart (supports QR upload)
    public static function create() {
        Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $type = trim($_POST['type'] ?? '');
        if (!in_array($type, ['bank', 'upi'])) jsonResponse(['error' => 'type must be bank or upi'], 422);

        $label          = trim($_POST['label'] ?? '');
        $isDefault      = !empty($_POST['isDefault']) ? 1 : 0;
        $accountHolder  = trim($_POST['accountHolder']  ?? '');
        $accountNumber  = trim($_POST['accountNumber']  ?? '');
        $ifscCode       = strtoupper(trim($_POST['ifscCode'] ?? ''));
        $bankName       = trim($_POST['bankName']       ?? '');
        $branch         = trim($_POST['branch']         ?? '');
        $upiId          = trim($_POST['upiId']          ?? '');
        $qrCodePath     = null;

        if ($type === 'bank' && !$accountNumber) jsonResponse(['error' => 'accountNumber is required for bank accounts'], 422);
        if ($type === 'upi'  && !$upiId)         jsonResponse(['error' => 'upiId is required for UPI accounts'], 422);

        // QR code upload
        if ($type === 'upi' && !empty($_FILES['qrCode']) && $_FILES['qrCode']['error'] === UPLOAD_ERR_OK) {
            $qrCodePath = self::saveQR($_FILES['qrCode']);
        }

        // If marking as default, unset others of same type
        if ($isDefault) {
            $db->prepare("UPDATE payment_accounts SET is_default = 0 WHERE type = ?")->execute([$type]);
        }

        $stmt = $db->prepare("
            INSERT INTO payment_accounts
                (type, label, account_holder, account_number, ifsc_code, bank_name, branch,
                 upi_id, qr_code_path, is_default, is_active, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,1,NOW(),NOW())
        ");
        $stmt->execute([$type, $label, $accountHolder, $accountNumber, $ifscCode, $bankName, $branch, $upiId, $qrCodePath, $isDefault]);
        $id = (int)$db->lastInsertId();

        $s = $db->prepare("SELECT * FROM payment_accounts WHERE id = ?"); $s->execute([$id]);
        jsonResponse(['account' => self::format($s->fetch())], 201);
    }

    // PUT /api/admin/payment-accounts/:id
    public static function update($id) {
        Auth::protect();
        Auth::authorize('admin');
        $db = getDb();
        $s = $db->prepare("SELECT * FROM payment_accounts WHERE id = ? AND is_active = 1"); $s->execute([$id]);
        $row = $s->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);

        // Support both JSON and multipart
        $isMultipart = !empty($_FILES) || !empty($_POST);
        if ($isMultipart) {
            $data = $_POST;
        } else {
            $data = getJsonInput();
        }

        $fields = []; $params = [];
        foreach (['label','account_holder','account_number','ifsc_code','bank_name','branch','upi_id'] as $col) {
            $camel = lcfirst(str_replace('_', '', ucwords($col, '_')));
            if (isset($data[$camel])) { $fields[] = "$col = ?"; $params[] = trim($data[$camel]); }
            elseif (isset($data[$col])) { $fields[] = "$col = ?"; $params[] = trim($data[$col]); }
        }

        // QR code upload
        if (!empty($_FILES['qrCode']) && $_FILES['qrCode']['error'] === UPLOAD_ERR_OK) {
            $qrPath = self::saveQR($_FILES['qrCode']);
            $fields[] = "qr_code_path = ?"; $params[] = $qrPath;
        }

        // Default flag
        $isDefaultRaw = $data['isDefault'] ?? $data['is_default'] ?? null;
        if ($isDefaultRaw !== null) {
            $isDefault = (int)(bool)$isDefaultRaw;
            if ($isDefault) $db->prepare("UPDATE payment_accounts SET is_default = 0 WHERE type = ?")->execute([$row['type']]);
            $fields[] = "is_default = ?"; $params[] = $isDefault;
        }

        if ($fields) {
            $fields[] = "updated_at = NOW()";
            $params[] = $id;
            $db->prepare("UPDATE payment_accounts SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        $s = $db->prepare("SELECT * FROM payment_accounts WHERE id = ?"); $s->execute([$id]);
        jsonResponse(['account' => self::format($s->fetch())]);
    }

    // DELETE /api/admin/payment-accounts/:id
    public static function delete($id) {
        Auth::protect();
        Auth::authorize('admin');
        $db = getDb();
        $db->prepare("UPDATE payment_accounts SET is_active = 0, updated_at = NOW() WHERE id = ?")->execute([$id]);
        jsonResponse(['success' => true]);
    }

    // PUT /api/admin/payment-accounts/:id/set-default
    public static function setDefault($id) {
        Auth::protect();
        Auth::authorize('admin');
        $db = getDb();
        $s = $db->prepare("SELECT type FROM payment_accounts WHERE id = ? AND is_active = 1"); $s->execute([$id]);
        $row = $s->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        $db->prepare("UPDATE payment_accounts SET is_default = 0 WHERE type = ?")->execute([$row['type']]);
        $db->prepare("UPDATE payment_accounts SET is_default = 1, updated_at = NOW() WHERE id = ?")->execute([$id]);
        jsonResponse(['success' => true]);
    }

    // ===== HELPERS =====
    public static function format($r) {
        if (!$r) return null;
        return [
            'id'             => (int)$r['id'],
            'type'           => $r['type'],
            'label'          => $r['label'] ?? '',
            'accountHolder'  => $r['account_holder'] ?? '',
            'accountNumber'  => $r['account_number'] ?? '',
            'ifscCode'       => $r['ifsc_code'] ?? '',
            'bankName'       => $r['bank_name'] ?? '',
            'branch'         => $r['branch'] ?? '',
            'upiId'          => $r['upi_id'] ?? '',
            'qrCodePath'     => $r['qr_code_path'] ? ('/' . ltrim($r['qr_code_path'], '/')) : null,
            'isDefault'      => (bool)$r['is_default'],
            'isActive'       => (bool)$r['is_active'],
            'createdAt'      => $r['created_at'],
            'updatedAt'      => $r['updated_at'],
        ];
    }

    private static function saveQR($file) {
        $uploadDir = __DIR__ . '/../../uploads/payment-qr/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);
        $ext = strtolower(pathinfo(basename($file['name']), PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg','jpeg','png','gif','webp'])) return null;
        $name = 'qr_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        $dest = $uploadDir . $name;
        if (move_uploaded_file($file['tmp_name'], $dest)) {
            return 'uploads/payment-qr/' . $name;
        }
        return null;
    }
}
