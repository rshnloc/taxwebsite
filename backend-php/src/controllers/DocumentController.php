<?php
class DocumentController {

    private static $allowedMimes = [
        'application/pdf',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ];

    private static $maxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    /**
     * POST /api/applications/:id/documents/upload
     * Multipart form-data: files[], names[], passwords[], hints[], categories[]
     */
    public static function uploadDocuments($applicationId) {
        $user = Auth::protect();
        $db   = getDb();

        // Verify application exists and user has access
        $stmt = $db->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$applicationId]);
        $app = $stmt->fetch();
        if (!$app) jsonResponse(['error' => 'Application not found'], 404);

        if ($user['role'] === 'client' && $app['client_id'] !== $user['id']) {
            jsonResponse(['error' => 'Access denied'], 403);
        }

        if (empty($_FILES['files'])) {
            jsonResponse(['error' => 'No files uploaded'], 422);
        }

        // Normalize $_FILES['files'] into array of individual files
        $files = self::normalizeFileArray($_FILES['files']);
        if (empty($files)) jsonResponse(['error' => 'No valid files'], 422);

        $uploadDir = __DIR__ . '/../../uploads/' . $applicationId . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $uploaded  = [];
        $errors    = [];

        foreach ($files as $i => $file) {
            // Validate
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $errors[] = "File {$i}: upload error code {$file['error']}";
                continue;
            }
            if ($file['size'] > self::$maxFileSizeBytes) {
                $errors[] = "File {$i} ({$file['name']}) exceeds 10MB limit";
                continue;
            }

            $detectedMime = mime_content_type($file['tmp_name']);
            if (!in_array($detectedMime, self::$allowedMimes)) {
                $errors[] = "File {$i} ({$file['name']}): type '$detectedMime' not allowed";
                continue;
            }

            // Safe filename
            $ext        = pathinfo($file['name'], PATHINFO_EXTENSION);
            $safeBase   = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
            $storedName = $safeBase . '_' . uniqid() . '.' . $ext;
            $destPath   = $uploadDir . $storedName;

            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                $errors[] = "File {$i}: failed to save";
                continue;
            }

            // Optional document password — encrypt with AES-256
            $rawPassword = $_POST['passwords'][$i] ?? '';
            $encPassword = null;
            $hint        = $_POST['hints'][$i] ?? null;
            $isPwdProtected = 0;

            if ($rawPassword !== '') {
                $encPassword = self::encryptPassword($rawPassword);
                $isPwdProtected = 1;
            }

            $docName  = $_POST['names'][$i] ?? $file['name'];
            $category = $_POST['categories'][$i] ?? 'general';

            // Save metadata
            $ins = $db->prepare("
                INSERT INTO application_documents
                  (application_id, name, original_name, path, mime_type, size,
                   uploaded_by, category, is_password_protected, doc_password_enc, doc_password_hint, upload_status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')
            ");
            $ins->execute([
                $applicationId,
                $docName,
                $file['name'],
                'uploads/' . $applicationId . '/' . $storedName,
                $detectedMime,
                $file['size'],
                $user['id'],
                $category,
                $isPwdProtected,
                $encPassword,
                $hint,
            ]);
            $docId = (int)$db->lastInsertId();

            $uploaded[] = [
                'id'                 => $docId,
                'name'               => $docName,
                'originalName'       => $file['name'],
                'mimeType'           => $detectedMime,
                'size'               => $file['size'],
                'category'           => $category,
                'isPasswordProtected'=> (bool)$isPwdProtected,
                'passwordHint'       => $hint,
                'uploadStatus'       => 'pending',
            ];

            appLog('info', 'Document uploaded', [
                'applicationId' => (int)$applicationId,
                'docId'         => $docId,
                'userId'        => $user['id'],
                'fileName'      => $file['name'],
            ]);
        }

        jsonResponse([
            'uploaded' => $uploaded,
            'errors'   => $errors,
            'message'  => count($uploaded) . ' file(s) uploaded successfully',
        ], count($uploaded) > 0 ? 200 : 422);
    }

    /**
     * GET /api/applications/:id/documents
     */
    public static function getDocuments($applicationId) {
        $user = Auth::protect();
        $db   = getDb();

        $stmt = $db->prepare("SELECT client_id FROM applications WHERE id = ?");
        $stmt->execute([$applicationId]);
        $app = $stmt->fetch();
        if (!$app) jsonResponse(['error' => 'Application not found'], 404);
        if ($user['role'] === 'client' && $app['client_id'] !== $user['id']) {
            jsonResponse(['error' => 'Access denied'], 403);
        }

        $docs = $db->prepare("
            SELECT id, name, original_name, path, mime_type, size, category,
                   is_password_protected, doc_password_hint, upload_status, uploaded_at,
                   uploaded_by
            FROM application_documents WHERE application_id = ?
            ORDER BY uploaded_at DESC
        ");
        $docs->execute([$applicationId]);
        $list = array_map(fn($d) => [
            'id'                  => (int)$d['id'],
            'name'                => $d['name'],
            'originalName'        => $d['original_name'],
            'path'                => $d['path'],
            'mimeType'            => $d['mime_type'],
            'size'                => (int)$d['size'],
            'category'            => $d['category'],
            'isPasswordProtected' => (bool)$d['is_password_protected'],
            'passwordHint'        => $d['doc_password_hint'],
            'uploadStatus'        => $d['upload_status'],
            'uploadedAt'          => $d['uploaded_at'],
        ], $docs->fetchAll());

        jsonResponse(['documents' => $list]);
    }

    /**
     * GET /api/documents/:id/password  (admin only — decrypt and return password)
     */
    public static function getDocumentPassword($docId) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();

        $stmt = $db->prepare("SELECT doc_password_enc, is_password_protected FROM application_documents WHERE id = ?");
        $stmt->execute([$docId]);
        $doc = $stmt->fetch();
        if (!$doc) jsonResponse(['error' => 'Document not found'], 404);
        if (!$doc['is_password_protected']) jsonResponse(['error' => 'Document is not password protected'], 400);

        $password = self::decryptPassword($doc['doc_password_enc']);
        jsonResponse(['password' => $password]);
    }

    /**
     * PATCH /api/documents/:id/status  (admin/employee)
     */
    public static function updateDocumentStatus($docId) {
        Auth::protect();
        $user = Auth::user();
        if (!in_array($user['role'], ['admin', 'employee'])) {
            jsonResponse(['error' => 'Access denied'], 403);
        }
        $data = getJsonInput();
        $db   = getDb();

        $status = $data['status'] ?? '';
        if (!in_array($status, ['pending', 'verified', 'rejected'])) {
            jsonResponse(['error' => 'Invalid status'], 422);
        }

        $db->prepare("UPDATE application_documents SET upload_status = ? WHERE id = ?")->execute([$status, $docId]);
        jsonResponse(['message' => 'Document status updated']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static function getEncKey(): string {
        $config = require __DIR__ . '/../../config.php';
        // Use first 32 chars of JWT_SECRET as AES key
        return substr(hash('sha256', $config['JWT_SECRET']), 0, 32);
    }

    public static function encryptPassword(string $plaintext): string {
        $key    = self::getEncKey();
        $iv     = random_bytes(16);
        $cipher = openssl_encrypt($plaintext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $cipher);
    }

    public static function decryptPassword(string $encrypted): string {
        $key  = self::getEncKey();
        $raw  = base64_decode($encrypted);
        $iv   = substr($raw, 0, 16);
        $data = substr($raw, 16);
        return openssl_decrypt($data, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    }

    private static function normalizeFileArray(array $fileInput): array {
        $files = [];
        if (is_array($fileInput['name'])) {
            for ($i = 0; $i < count($fileInput['name']); $i++) {
                $files[] = [
                    'name'     => $fileInput['name'][$i],
                    'type'     => $fileInput['type'][$i],
                    'tmp_name' => $fileInput['tmp_name'][$i],
                    'error'    => $fileInput['error'][$i],
                    'size'     => $fileInput['size'][$i],
                ];
            }
        } else {
            $files[] = $fileInput;
        }
        return $files;
    }
}
