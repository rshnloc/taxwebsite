<?php
class NotificationController {

    private static function formatNotification($n) {
        return [
            'id' => (int)$n['id'], '_id' => (string)$n['id'],
            'user' => (string)$n['user_id'],
            'title' => $n['title'], 'message' => $n['message'],
            'type' => $n['type'], 'channel' => $n['channel'] ?? 'in_app', 'link' => $n['link'],
            'payload' => json_decode($n['payload'] ?? 'null', true),
            'isRead' => (bool)$n['is_read'], 'readAt' => $n['read_at'],
            'createdAt' => $n['created_at'],
        ];
    }

    // GET /api/notifications
    public static function getNotifications() {
        Auth::protect();
        $db = getDb();
        $page = max(1, (int)($_GET['page'] ?? 1)); $limit = max(1, (int)($_GET['limit'] ?? 30));

        $stmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ?");
        $stmt->execute([Auth::userId()]); $total = (int)$stmt->fetchColumn();

        $offset = ($page - 1) * $limit;
        $stmt = $db->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute([Auth::userId()]);
        $notifications = array_map([self::class, 'formatNotification'], $stmt->fetchAll());

        jsonResponse(['notifications' => $notifications, 'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)]]);
    }

    // GET /api/notifications/unread-count
    public static function getUnreadCount() {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
        $stmt->execute([Auth::userId()]);
        jsonResponse(['count' => (int)$stmt->fetchColumn()]);
    }

    // PUT|PATCH /api/notifications/:id/read
    public static function markAsRead($id) {
        Auth::protect();
        $db = getDb();
        $db->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?")->execute([$id, Auth::userId()]);
        jsonResponse(['message' => 'Marked as read']);
    }

    // PUT|PATCH /api/notifications/read-all
    public static function markAllAsRead() {
        Auth::protect();
        $db = getDb();
        $db->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0")->execute([Auth::userId()]);
        jsonResponse(['message' => 'All notifications marked as read']);
    }

    public static function registerDevice() {
        Auth::protect();
        $data = getJsonInput();
        $platform = $data['platform'] ?? '';
        $deviceToken = trim((string)($data['deviceToken'] ?? ''));
        $endpoint = trim((string)($data['endpoint'] ?? ''));

        if (!in_array($platform, ['web', 'android', 'ios'], true)) {
            jsonResponse(['error' => 'Invalid platform'], 400);
        }
        if ($deviceToken === '') {
            jsonResponse(['error' => 'deviceToken is required'], 400);
        }

        $db = getDb();
        $stmt = $db->prepare("INSERT INTO notification_devices (user_id, platform, device_token, endpoint, is_active, last_seen_at) VALUES (?,?,?,?,1,NOW()) ON DUPLICATE KEY UPDATE platform = VALUES(platform), endpoint = VALUES(endpoint), is_active = 1, last_seen_at = NOW()");
        $stmt->execute([Auth::userId(), $platform, $deviceToken, $endpoint ?: null]);

        jsonResponse(['message' => 'Device registered']);
    }
}
