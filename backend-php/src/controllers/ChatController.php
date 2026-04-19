<?php
class ChatController {

    private static function formatRoom($r, $db) {
        if (!$r) return null;
        $id = (int)$r['id'];

        // Participants
        $stmt = $db->prepare("SELECT u.* FROM chat_room_participants cp JOIN users u ON cp.user_id = u.id WHERE cp.room_id = ?");
        $stmt->execute([$id]);
        $participants = array_map('formatUser', $stmt->fetchAll());

        // Application
        $app = null;
        if ($r['application_id']) {
            $s = $db->prepare("SELECT id, application_id FROM applications WHERE id = ?");
            $s->execute([$r['application_id']]);
            $a = $s->fetch();
            if ($a) $app = ['_id' => (string)$a['id'], 'applicationId' => $a['application_id']];
        }

        $lastMsg = null;
        if ($r['last_message_content']) {
            $lastMsg = [
                'content' => $r['last_message_content'],
                'sender' => $r['last_message_sender_id'] ? ['_id' => (string)$r['last_message_sender_id']] : null,
                'timestamp' => $r['last_message_timestamp'],
            ];
        }

        return [
            'id' => $id, '_id' => (string)$id,
            'application' => $app, 'participants' => $participants,
            'lastMessage' => $lastMsg, 'isActive' => (bool)$r['is_active'],
            'createdAt' => $r['created_at'], 'updatedAt' => $r['updated_at'],
        ];
    }

    // GET /api/chat/rooms
    public static function getChatRooms() {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT cr.* FROM chat_rooms cr JOIN chat_room_participants cp ON cr.id = cp.room_id WHERE cp.user_id = ? AND cr.is_active = 1 ORDER BY cr.updated_at DESC");
        $stmt->execute([Auth::userId()]);
        $rooms = array_map(fn($r) => self::formatRoom($r, $db), $stmt->fetchAll());
        jsonResponse(['rooms' => $rooms]);
    }

    // GET /api/chat/rooms/:id
    public static function getChatRoom($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM chat_rooms WHERE id = ?");
        $stmt->execute([$id]);
        $r = $stmt->fetch();
        if (!$r) jsonResponse(['error' => 'Chat room not found'], 404);
        jsonResponse(['room' => self::formatRoom($r, $db)]);
    }

    // GET /api/chat/rooms/:id/messages
    public static function getMessages($roomId) {
        Auth::protect();
        $db = getDb();
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 50));
        $offset = ($page - 1) * $limit;

        $stmt = $db->prepare("SELECT m.*, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.room_id = ? ORDER BY m.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute([$roomId]);
        $messages = array_reverse(array_map(fn($m) => [
            'id' => (int)$m['id'], '_id' => (string)$m['id'],
            'room' => (string)$roomId,
            'sender' => ['_id' => (string)$m['sender_id'], 'name' => $m['sender_name'], 'role' => $m['sender_role'], 'avatar' => $m['sender_avatar']],
            'content' => $m['content'], 'type' => $m['type'],
            'fileUrl' => $m['file_url'], 'fileName' => $m['file_name'],
            'isRead' => (bool)$m['is_read'], 'readAt' => $m['read_at'],
            'createdAt' => $m['created_at'],
        ], $stmt->fetchAll()));

        // Mark as read
        $db->prepare("UPDATE messages SET is_read = 1, read_at = NOW() WHERE room_id = ? AND sender_id != ? AND is_read = 0")
           ->execute([$roomId, Auth::userId()]);

        jsonResponse(['messages' => $messages]);
    }

    // POST /api/chat/rooms
    public static function createChatRoom() {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();
        $applicationId = $data['applicationId'] ?? null;
        $participantIds = $data['participantIds'] ?? [];

        // Check existing
        if ($applicationId) {
            $stmt = $db->prepare("SELECT * FROM chat_rooms WHERE application_id = ?");
            $stmt->execute([$applicationId]);
            $existing = $stmt->fetch();
            if ($existing) {
                jsonResponse(['room' => self::formatRoom($existing, $db)]);
            }
        }

        $stmt = $db->prepare("INSERT INTO chat_rooms (application_id) VALUES (?)");
        $stmt->execute([$applicationId]);
        $roomId = (int)$db->lastInsertId();

        // Add participants
        $allParticipants = array_unique(array_merge($participantIds, [Auth::userId()]));
        $ins = $db->prepare("INSERT INTO chat_room_participants (room_id, user_id) VALUES (?,?)");
        foreach ($allParticipants as $uid) { $ins->execute([$roomId, $uid]); }

        $stmt = $db->prepare("SELECT * FROM chat_rooms WHERE id = ?");
        $stmt->execute([$roomId]);
        jsonResponse(['room' => self::formatRoom($stmt->fetch(), $db)], 201);
    }

    // POST /api/chat/rooms/:id/messages
    public static function sendMessage($roomId) {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();
        $content = $data['content'] ?? '';
        $type = $data['type'] ?? 'text';
        $fileUrl = null; $fileName = null;

        // Handle file upload
        if (!empty($_FILES['file'])) {
            $uploadDir = __DIR__ . '/../../uploads/chat/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $file = $_FILES['file'];
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = bin2hex(random_bytes(16)) . '.' . $ext;
            move_uploaded_file($file['tmp_name'], $uploadDir . $filename);
            $type = 'file';
            $fileUrl = "/uploads/chat/$filename";
            $fileName = $file['name'];
            if (!$content) $content = $file['name'];
        }

        $stmt = $db->prepare("INSERT INTO messages (room_id, sender_id, content, type, file_url, file_name) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$roomId, Auth::userId(), $content, $type, $fileUrl, $fileName]);
        $msgId = (int)$db->lastInsertId();

        // Update last message
        $db->prepare("UPDATE chat_rooms SET last_message_content = ?, last_message_sender_id = ?, last_message_timestamp = NOW(), updated_at = NOW() WHERE id = ?")
           ->execute([$content, Auth::userId(), $roomId]);

        $stmt = $db->prepare("SELECT m.*, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.id = ?");
        $stmt->execute([$msgId]);
        $m = $stmt->fetch();
        jsonResponse(['message' => [
            'id' => (int)$m['id'], '_id' => (string)$m['id'],
            'room' => (string)$roomId,
            'sender' => ['_id' => (string)$m['sender_id'], 'name' => $m['sender_name'], 'role' => $m['sender_role'], 'avatar' => $m['sender_avatar']],
            'content' => $m['content'], 'type' => $m['type'],
            'fileUrl' => $m['file_url'], 'fileName' => $m['file_name'],
            'isRead' => false, 'createdAt' => $m['created_at'],
        ]], 201);
    }
}
