<?php
class AuthController {

    // POST /api/auth/register
    public static function register() {
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $phone = trim($data['phone'] ?? '');

        if (!$name) jsonResponse(['error' => 'Name is required'], 400);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Valid email is required'], 400);
        if (strlen($password) < 6) jsonResponse(['error' => 'Password must be at least 6 characters'], 400);

        $db = getDb();
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) jsonResponse(['error' => 'Email already registered'], 400);

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $db->prepare("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'client')");
        $stmt->execute([$name, $email, $hash, $phone]);
        $userId = (int)$db->lastInsertId();

        // Activity log
        $db->prepare("INSERT INTO activity_logs (user_id, action, entity, entity_id) VALUES (?, 'User registered', 'user', ?)")
           ->execute([$userId, $userId]);

        $token = Auth::generateToken($userId);
        jsonResponse([
            'token' => $token,
            'user' => ['id' => $userId, '_id' => (string)$userId, 'name' => $name, 'email' => $email, 'role' => 'client', 'phone' => $phone],
        ], 201);
    }

    // POST /api/auth/login
    public static function login() {
        $data = getJsonInput();
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Valid email is required'], 400);
        if (!$password) jsonResponse(['error' => 'Password is required'], 400);

        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) jsonResponse(['error' => 'Invalid credentials'], 401);
        if (!$user['is_active']) jsonResponse(['error' => 'Account has been deactivated. Contact support.'], 401);
        if (!password_verify($password, $user['password'])) jsonResponse(['error' => 'Invalid credentials'], 401);

        $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

        $token = Auth::generateToken($user['id']);
        jsonResponse([
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                '_id' => (string)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'phone' => $user['phone'] ?? '',
                'avatar' => $user['avatar'] ?? '',
            ],
        ]);
    }

    // GET /api/auth/me
    public static function getMe() {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([Auth::userId()]);
        $user = $stmt->fetch();
        jsonResponse(['user' => formatUser($user)]);
    }

    // PUT /api/auth/profile
    public static function updateProfile() {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();

        $fields = [];
        $params = [];
        foreach (['name' => 'name', 'phone' => 'phone', 'pan' => 'pan', 'gst' => 'gst', 'company_name' => 'companyName'] as $col => $key) {
            if (isset($data[$key])) { $fields[] = "$col = ?"; $params[] = $data[$key]; }
        }
        // Nested address
        if (isset($data['address'])) {
            foreach (['street' => 'address_street', 'city' => 'address_city', 'state' => 'address_state', 'pincode' => 'address_pincode'] as $k => $col) {
                if (isset($data['address'][$k])) { $fields[] = "$col = ?"; $params[] = $data['address'][$k]; }
            }
        }

        if ($fields) {
            $params[] = Auth::userId();
            $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([Auth::userId()]);
        jsonResponse(['user' => formatUser($stmt->fetch())]);
    }

    // PUT /api/auth/change-password
    public static function changePassword() {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();

        $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([Auth::userId()]);
        $user = $stmt->fetch();

        if (!password_verify($data['currentPassword'] ?? '', $user['password'])) {
            jsonResponse(['error' => 'Current password is incorrect'], 400);
        }

        $newPass = $data['newPassword'] ?? '';
        if (strlen($newPass) < 6) jsonResponse(['error' => 'Password must be at least 6 characters'], 400);

        $hash = password_hash($newPass, PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hash, Auth::userId()]);
        jsonResponse(['message' => 'Password changed successfully']);
    }

    // POST /api/auth/forgot-password
    public static function forgotPassword() {
        $data = getJsonInput();
        $email = strtolower(trim($data['email'] ?? ''));
        $db = getDb();

        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'No account with that email'], 404);

        $otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $db->prepare("UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?")
           ->execute([$otp, $email]);

        jsonResponse(['message' => 'OTP sent to your email']);
    }

    // POST /api/auth/verify-otp
    public static function verifyOTP() {
        $data = getJsonInput();
        $email = strtolower(trim($data['email'] ?? ''));
        $otp = $data['otp'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        $db = getDb();
        $stmt = $db->prepare("SELECT id, otp, otp_expiry FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || $user['otp'] !== $otp || strtotime($user['otp_expiry']) < time()) {
            jsonResponse(['error' => 'Invalid or expired OTP'], 400);
        }

        $updates = "otp = NULL, otp_expiry = NULL, is_verified = 1";
        $params = [];
        if ($newPassword) {
            $updates .= ", password = ?";
            $params[] = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        }
        $params[] = $user['id'];
        $db->prepare("UPDATE users SET $updates WHERE id = ?")->execute($params);

        $token = Auth::generateToken($user['id']);
        jsonResponse(['token' => $token, 'message' => 'Verification successful']);
    }
}
