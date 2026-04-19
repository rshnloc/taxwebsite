<?php
class NotificationController {

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
        $notifications = array_map(fn($n) => [
            'id' => (int)$n['id'], '_id' => (string)$n['id'],
            'user' => (string)$n['user_id'],
            'title' => $n['title'], 'message' => $n['message'],
            'type' => $n['type'], 'link' => $n['link'],
            'isRead' => (bool)$n['is_read'], 'readAt' => $n['read_at'],
            'createdAt' => $n['created_at'],
        ], $stmt->fetchAll());

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
        $db->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Marked as read']);
    }

    // PUT|PATCH /api/notifications/read-all
    public static function markAllAsRead() {
        Auth::protect();
        $db = getDb();
        $db->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0")->execute([Auth::userId()]);
        jsonResponse(['message' => 'All notifications marked as read']);
    }
}
