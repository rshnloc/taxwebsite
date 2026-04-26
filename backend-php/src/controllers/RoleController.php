<?php
class RoleController {

    private static function formatRole($r, $db) {
        $stmt = $db->prepare("
            SELECT p.id, p.module, p.action, p.label
            FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.module, p.action
        ");
        $stmt->execute([$r['id']]);
        $permissions = $stmt->fetchAll();

        // Count users with this role
        $c = $db->prepare("SELECT COUNT(*) FROM user_roles WHERE role_id = ?");
        $c->execute([$r['id']]);
        $userCount = (int)$c->fetchColumn();

        return [
            'id'          => (int)$r['id'],
            'name'        => $r['name'],
            'slug'        => $r['slug'],
            'description' => $r['description'],
            'isSystem'    => (bool)$r['is_system'],
            'isActive'    => (bool)$r['is_active'],
            'userCount'   => $userCount,
            'permissions' => $permissions,
            'createdAt'   => $r['created_at'],
        ];
    }

    // GET /api/roles
    public static function getRoles() {
        Auth::protect();
        $db = getDb();
        $stmt = $db->query("SELECT * FROM roles ORDER BY is_system DESC, name");
        $roles = array_map(fn($r) => self::formatRole($r, $db), $stmt->fetchAll());
        jsonResponse(['roles' => $roles]);
    }

    // GET /api/roles/:id
    public static function getRoleById($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        $role = $stmt->fetch();
        if (!$role) jsonResponse(['error' => 'Role not found'], 404);
        jsonResponse(['role' => self::formatRole($role, $db)]);
    }

    // GET /api/permissions
    public static function getPermissions() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->query("SELECT * FROM permissions ORDER BY module, action");
        $perms = $stmt->fetchAll();

        // Group by module
        $grouped = [];
        foreach ($perms as $p) {
            $grouped[$p['module']][] = [
                'id'     => (int)$p['id'],
                'action' => $p['action'],
                'label'  => $p['label'],
            ];
        }
        $modules = [];
        foreach ($grouped as $module => $actions) {
            $modules[] = ['module' => $module, 'actions' => $actions];
        }
        jsonResponse(['permissions' => $perms, 'modules' => $modules]);
    }

    // POST /api/roles
    public static function createRole() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $name = trim($data['name'] ?? '');
        if (!$name) jsonResponse(['error' => 'Role name is required'], 422);

        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
        $slug = trim($slug, '-');

        $stmt = $db->prepare("INSERT INTO roles (name, slug, description, is_active) VALUES (?,?,?,1)");
        $stmt->execute([$name, $slug, $data['description'] ?? null]);
        $id = (int)$db->lastInsertId();

        // Assign initial permissions if provided
        if (!empty($data['permissionIds'])) {
            self::syncPermissions($db, $id, $data['permissionIds']);
        }

        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['role' => self::formatRole($stmt->fetch(), $db)], 201);
    }

    // PUT /api/roles/:id
    public static function updateRole($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        $role = $stmt->fetch();
        if (!$role) jsonResponse(['error' => 'Role not found'], 404);

        $fields = []; $params = [];
        if (isset($data['name'])) {
            $fields[] = "name = ?"; $params[] = $data['name'];
            $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($data['name']));
            $fields[] = "slug = ?"; $params[] = trim($slug, '-');
        }
        if (isset($data['description'])) { $fields[] = "description = ?"; $params[] = $data['description']; }
        if (isset($data['isActive']))    { $fields[] = "is_active = ?";    $params[] = $data['isActive'] ? 1 : 0; }

        if ($fields) {
            $params[] = $id;
            $db->prepare("UPDATE roles SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        // Sync permissions if provided
        if (isset($data['permissionIds'])) {
            self::syncPermissions($db, $id, $data['permissionIds']);
        }

        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['role' => self::formatRole($stmt->fetch(), $db)]);
    }

    // DELETE /api/roles/:id
    public static function deleteRole($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        $role = $stmt->fetch();
        if (!$role) jsonResponse(['error' => 'Role not found'], 404);
        if ($role['is_system']) jsonResponse(['error' => 'System roles cannot be deleted'], 403);

        $db->prepare("DELETE FROM roles WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Role deleted']);
    }

    // PUT /api/roles/:id/permissions — replace full permission set
    public static function updateRolePermissions($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $stmt = $db->prepare("SELECT id FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Role not found'], 404);

        $permIds = $data['permissionIds'] ?? [];
        self::syncPermissions($db, $id, $permIds);

        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['role' => self::formatRole($stmt->fetch(), $db)]);
    }

    // PUT /api/users/:id/role — assign dynamic role to user
    public static function assignUserRole($userId) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db   = getDb();

        $roleId = (int)($data['roleId'] ?? 0);
        if (!$roleId) jsonResponse(['error' => 'roleId required'], 422);

        // Verify user + role exist
        $u = $db->prepare("SELECT id FROM users WHERE id = ?");
        $u->execute([$userId]);
        if (!$u->fetch()) jsonResponse(['error' => 'User not found'], 404);

        $r = $db->prepare("SELECT id FROM roles WHERE id = ?");
        $r->execute([$roleId]);
        if (!$r->fetch()) jsonResponse(['error' => 'Role not found'], 404);

        // Remove old dynamic role, set new
        $db->prepare("DELETE FROM user_roles WHERE user_id = ?")->execute([$userId]);
        $db->prepare("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?,?,?)")
           ->execute([$userId, $roleId, Auth::userId()]);
        $db->prepare("UPDATE users SET dynamic_role_id = ? WHERE id = ?")->execute([$roleId, $userId]);

        jsonResponse(['message' => 'Role assigned successfully']);
    }

    private static function syncPermissions($db, $roleId, $permissionIds) {
        $db->prepare("DELETE FROM role_permissions WHERE role_id = ?")->execute([$roleId]);
        if (empty($permissionIds)) return;
        $stmt = $db->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)");
        foreach ($permissionIds as $pid) {
            $stmt->execute([$roleId, (int)$pid]);
        }
    }
}
