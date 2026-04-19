<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth {
    public static function generateToken($userId) {
        $config = require __DIR__ . '/../config.php';
        $payload = [
            'id' => $userId,
            'iat' => time(),
            'exp' => time() + $config['JWT_EXPIRES_IN'],
        ];
        return JWT::encode($payload, $config['JWT_SECRET'], 'HS256');
    }

    /**
     * Returns user array or null. Sets $GLOBALS['auth_user'].
     */
    public static function protect() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
            http_response_code(401);
            echo json_encode(['error' => 'Not authorized, no token provided']);
            exit;
        }

        $config = require __DIR__ . '/../config.php';
        try {
            $decoded = JWT::decode($m[1], new Key($config['JWT_SECRET'], 'HS256'));
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, name, email, phone, role, avatar, address_street, address_city, address_state, address_pincode, pan, gst, company_name, department, designation, is_active, is_verified, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$decoded->id]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'User not found']);
            exit;
        }
        if (!$user['is_active']) {
            http_response_code(401);
            echo json_encode(['error' => 'Account has been deactivated']);
            exit;
        }

        $GLOBALS['auth_user'] = $user;
        return $user;
    }

    public static function authorize(...$roles) {
        $user = $GLOBALS['auth_user'] ?? null;
        if (!$user || !in_array($user['role'], $roles)) {
            http_response_code(403);
            echo json_encode(['error' => "Role '{$user['role']}' is not authorized to access this route"]);
            exit;
        }
    }

    public static function user() {
        return $GLOBALS['auth_user'] ?? null;
    }

    public static function userId() {
        return ($GLOBALS['auth_user'] ?? [])['id'] ?? null;
    }
}
