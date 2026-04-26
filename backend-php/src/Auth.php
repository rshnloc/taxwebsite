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
        $stmt = $db->prepare("SELECT id, name, email, phone, role, avatar, address_street, address_city, address_state, address_pincode, pan, gst, company_name, department, designation, is_active, is_verified, client_type_id, dynamic_role_id, created_at, updated_at FROM users WHERE id = ?");
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

    /**
     * Check if the authenticated user has a specific permission.
     * Falls back gracefully if dynamic roles not set up.
     * Usage: Auth::can('applications', 'create')
     */
    public static function can(string $module, string $action): bool {
        $user = $GLOBALS['auth_user'] ?? null;
        if (!$user) return false;

        // Admin always has all permissions
        if ($user['role'] === 'admin') return true;

        $db = getDb();

        // Check via dynamic role if assigned
        $roleId = $user['dynamic_role_id'] ?? null;
        if (!$roleId) {
            // Fallback: map ENUM role to system role slug
            $slugMap = ['employee' => 'employee', 'client' => 'client'];
            $slug    = $slugMap[$user['role']] ?? null;
            if ($slug) {
                $r = $db->prepare("SELECT id FROM roles WHERE slug = ?");
                $r->execute([$slug]);
                $row = $r->fetch();
                $roleId = $row ? $row['id'] : null;
            }
        }

        if (!$roleId) return false;

        $stmt = $db->prepare("
            SELECT COUNT(*) FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role_id = ? AND p.module = ? AND p.action = ?
        ");
        $stmt->execute([$roleId, $module, $action]);
        return (int)$stmt->fetchColumn() > 0;
    }

    /**
     * Enforce a permission — exits with 403 if not allowed.
     */
    public static function requirePermission(string $module, string $action): void {
        if (!self::can($module, $action)) {
            http_response_code(403);
            echo json_encode(['error' => "Permission denied: $module.$action"]);
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
