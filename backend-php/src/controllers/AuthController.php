<?php
class AuthController {

    // POST /api/auth/register
    public static function register() {
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $phone = trim($data['phone'] ?? '');
        $clientTypeSlug = trim($data['clientType'] ?? 'individual');

        if (!$name) jsonResponse(['error' => 'Name is required'], 400);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Valid email is required'], 400);
        if ($passwordError = validatePasswordStrength($password)) jsonResponse(['error' => $passwordError], 400);

        $db = getDb();
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) jsonResponse(['error' => 'Email already registered'], 400);

        // Resolve client_type_id from slug
        $clientTypeId = null;
        if ($clientTypeSlug) {
            $ct = $db->prepare("SELECT id FROM client_types WHERE slug = ? AND is_active = 1");
            $ct->execute([$clientTypeSlug]);
            $row = $ct->fetch();
            $clientTypeId = $row ? (int)$row['id'] : null;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $otpExpiry = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        $stmt = $db->prepare("INSERT INTO users (name, email, password, phone, role, client_type_id, otp, otp_expiry, is_verified) VALUES (?, ?, ?, ?, 'client', ?, ?, ?, 0)");
        $stmt->execute([$name, $email, $hash, $phone, $clientTypeId, $otp, $otpExpiry]);
        $userId = (int)$db->lastInsertId();

        // Activity log
        $db->prepare("INSERT INTO activity_logs (user_id, action, entity, entity_id) VALUES (?, 'User registered', 'user', ?)")
           ->execute([$userId, $userId]);

        try {
            Mailer::sendOtpEmail($email, $name, $otp);
        } catch (Throwable $e) {
            appLog('error', 'Failed to send OTP email', ['userId' => $userId, 'error' => $e->getMessage()]);
        }

        // Also queue welcome template if it exists (non-blocking)
        try {
            Mailer::queueTemplate($db, 'user-registration', $email, $name, [
                'user' => ['name' => $name, 'email' => $email],
            ]);
        } catch (Throwable $e) { /* template may not exist, ignore */ }

        appLog('info', 'User registered — OTP sent', ['userId' => $userId, 'email' => $email, 'otp' => $otp]);
        jsonResponse([
            'requiresOtp' => true,
            'email' => $email,
            'message' => 'OTP sent to your email. Please verify to complete registration.',
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

        // Block partner login unless approved
        if ($user['role'] === 'partner') {
            $partnerStatus = $user['partner_status'] ?? 'pending_review';
            if ($partnerStatus === 'pending_review') {
                jsonResponse(['error' => 'Your application is under review. You will be notified once approved.'], 403);
            }
            if (in_array($partnerStatus, ['reviewed', 'needs_update'])) {
                jsonResponse(['error' => 'Your application is still being processed. Please check your email for updates.'], 403);
            }
            if ($partnerStatus === 'rejected') {
                jsonResponse(['error' => 'Your partner application was not approved. Contact support for details.'], 403);
            }
        }
        
        // Auto-block employees whose last working day has passed
        if ($user['role'] === 'employee') {
            $lwd = $user['last_working_day'] ?? null;
            $status = $user['employment_status'] ?? 'active';
            if ($lwd && strtotime($lwd) < strtotime('today') && $status !== 'active') {
                jsonResponse(['error' => 'Your account has been deactivated due to resignation/termination. Please contact admin.'], 401);
            }
            if (in_array($status, ['resigned', 'terminated']) && $lwd && strtotime($lwd) < strtotime('today')) {
                // Auto deactivate
                $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$user['id']]);
                jsonResponse(['error' => 'Your account has been deactivated. Last working day has passed. Contact admin.'], 401);
            }
        }
        
        if (isset($user['is_verified']) && !$user['is_verified'] && $user['role'] === 'client') {
            jsonResponse(['error' => 'Please verify your email first.', 'requiresOtp' => true, 'email' => $user['email']], 403);
        }
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
        foreach (['name' => 'name', 'phone' => 'phone', 'alt_phone' => 'altPhone', 'pan' => 'pan', 'gst' => 'gst', 'company_name' => 'companyName'] as $col => $key) {
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

        $currentPassword = $data['currentPassword'] ?? $data['oldPassword'] ?? '';
        if (!password_verify($currentPassword, $user['password'])) {
            jsonResponse(['error' => 'Current password is incorrect'], 400);
        }

        $newPass = $data['newPassword'] ?? '';
        $confirmPassword = $data['confirmPassword'] ?? '';
        if ($newPass !== $confirmPassword) jsonResponse(['error' => 'New password and confirm password do not match'], 400);
        if ($newPass === $currentPassword) jsonResponse(['error' => 'New password must be different from current password'], 400);
        if ($passwordError = validatePasswordStrength($newPass)) jsonResponse(['error' => $passwordError], 400);

        $hash = password_hash($newPass, PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hash, Auth::userId()]);
        $db->prepare("INSERT INTO activity_logs (user_id, action, entity, entity_id) VALUES (?, 'Password changed', 'user', ?)")
           ->execute([Auth::userId(), Auth::userId()]);
        appLog('info', 'Password changed', ['userId' => Auth::userId()]);
        jsonResponse(['message' => 'Password changed successfully']);
    }

    // POST /api/auth/avatar
    public static function uploadAvatar() {
        Auth::protect();
        $db = getDb();
        if (empty($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'No file uploaded'], 400);
        }
        $file = $_FILES['avatar'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file['type'], $allowed)) jsonResponse(['error' => 'Only JPEG/PNG/WebP allowed'], 400);
        if ($file['size'] > 3 * 1024 * 1024) jsonResponse(['error' => 'Image must be under 3MB'], 400);

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $filename = 'avatar_' . Auth::userId() . '_' . time() . '.' . $ext;
        $uploadDir = __DIR__ . '/../../uploads/avatars/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);
        $dest = $uploadDir . $filename;

        // Delete old avatar
        $old = $db->prepare("SELECT avatar FROM users WHERE id = ?");
        $old->execute([Auth::userId()]);
        $oldAvatar = $old->fetchColumn();
        if ($oldAvatar) {
            $oldPath = $uploadDir . basename($oldAvatar);
            if (file_exists($oldPath)) @unlink($oldPath);
        }

        if (!move_uploaded_file($file['tmp_name'], $dest)) jsonResponse(['error' => 'Upload failed'], 500);

        $avatarUrl = 'uploads/avatars/' . $filename;
        $db->prepare("UPDATE users SET avatar = ? WHERE id = ?")->execute([$avatarUrl, Auth::userId()]);

        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([Auth::userId()]);
        jsonResponse(['user' => formatUser($stmt->fetch()), 'avatarUrl' => $avatarUrl]);
    }

    // POST /api/auth/forgot-password
    public static function forgotPassword() {
        $data = getJsonInput();
        $email = strtolower(trim($data['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Valid email is required'], 400);
        $db = getDb();

        $stmt = $db->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'No account found with that email'], 404);

        $otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $db->prepare("UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?")
           ->execute([$otp, $email]);

        try {
            Mailer::sendPasswordResetEmail($email, $user['name'], $otp);
        } catch (Throwable $e) {
            appLog('error', 'Failed to send password reset email', ['email' => $email, 'error' => $e->getMessage()]);
            jsonResponse(['error' => 'Could not send reset email: ' . $e->getMessage()], 500);
        }
        appLog('info', 'Password reset OTP sent', ['email' => $email]);
        jsonResponse(['message' => 'Password reset OTP sent to your email']);
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

    // POST /api/auth/resend-otp
    public static function resendOTP() {
        $data = getJsonInput();
        $email = strtolower(trim($data['email'] ?? ''));
        if (!$email) jsonResponse(['error' => 'Email is required'], 400);
        $db = getDb();
        $stmt = $db->prepare("SELECT id, is_verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'No account found with this email'], 404);
        if ($user['is_verified']) jsonResponse(['message' => 'Email already verified']);
        $otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $otpExpiry = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        $db->prepare("UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?")
            ->execute([$otp, $otpExpiry, $user['id']]);
        try {
            Mailer::sendOtpEmail($email, null, $otp);
        } catch (Throwable $e) {
            appLog('error', 'Failed to resend OTP email', ['userId' => $user['id'], 'error' => $e->getMessage()]);
            jsonResponse(['error' => 'Could not send OTP email: ' . $e->getMessage()], 500);
        }
        appLog('info', 'OTP resent', ['userId' => $user['id'], 'email' => $email, 'otp' => $otp]);
        jsonResponse(['message' => 'OTP resent to your email']);
    }
}