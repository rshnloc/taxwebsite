<?php
class Mailer {
    public static function queueTemplate($db, $templateSlug, $toEmail, $toName = null, $payload = []) {
        $stmt = $db->prepare("SELECT * FROM email_templates WHERE slug = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$templateSlug]);
        $template = $stmt->fetch();

        if (!$template) {
            throw new RuntimeException("Email template '{$templateSlug}' not found");
        }

        $subject = self::render($template['subject_template'], $payload);
        $bodyHtml = self::render($template['body_html'], $payload);
        $bodyText = self::render($template['body_text'], $payload);

        $insert = $db->prepare("INSERT INTO email_queue (to_email, to_name, template_slug, subject, body_html, body_text, payload, status, available_at) VALUES (?,?,?,?,?,?,?, 'queued', NOW())");
        $insert->execute([
            $toEmail,
            $toName,
            $templateSlug,
            $subject,
            $bodyHtml,
            $bodyText,
            json_encode($payload),
        ]);

        appLog('info', 'Email queued', ['template' => $templateSlug, 'toEmail' => $toEmail]);

        return (int)$db->lastInsertId();
    }

    public static function processQueue($db, $limit = 10) {
        $stmt = $db->prepare("SELECT * FROM email_queue WHERE status IN ('queued', 'failed') AND attempts < 5 AND available_at <= NOW() ORDER BY id ASC LIMIT $limit");
        $stmt->execute();
        $jobs = $stmt->fetchAll();

        $processed = 0;
        foreach ($jobs as $job) {
            $processed++;
            $db->prepare("UPDATE email_queue SET status = 'processing', attempts = attempts + 1 WHERE id = ?")->execute([$job['id']]);

            try {
                self::send($job['to_email'], $job['to_name'], $job['subject'], $job['body_html'], $job['body_text']);
                $db->prepare("UPDATE email_queue SET status = 'sent', sent_at = NOW(), last_error = NULL WHERE id = ?")->execute([$job['id']]);
                appLog('info', 'Email sent', ['queueId' => $job['id'], 'toEmail' => $job['to_email']]);
            } catch (Throwable $e) {
                $db->prepare("UPDATE email_queue SET status = 'failed', last_error = ? WHERE id = ?")->execute([$e->getMessage(), $job['id']]);
                appLog('error', 'Email send failed', ['queueId' => $job['id'], 'error' => $e->getMessage()]);
            }
        }

        return $processed;
    }

    private static function send($toEmail, $toName, $subject, $bodyHtml, $bodyText) {
        $config = require __DIR__ . '/../config.php';
        $fromEmail = $config['MAIL_FROM_EMAIL'] ?? 'no-reply@example.com';
        $fromName = $config['MAIL_FROM_NAME'] ?? 'Helpshack';

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $fromName . ' <' . $fromEmail . '>',
        ];

        $recipient = $toName ? sprintf('%s <%s>', $toName, $toEmail) : $toEmail;
        if (!mail($recipient, $subject, nl2br($bodyHtml ?: $bodyText), implode("\r\n", $headers))) {
            throw new RuntimeException('mail() returned false');
        }
    }

    private static function render($template, $payload) {
        return preg_replace_callback('/{{\s*([a-zA-Z0-9_\.]+)\s*}}/', function ($matches) use ($payload) {
            $value = $payload;
            foreach (explode('.', $matches[1]) as $segment) {
                if (is_array($value) && array_key_exists($segment, $value)) {
                    $value = $value[$segment];
                } else {
                    return '';
                }
            }
            return is_scalar($value) ? (string)$value : json_encode($value);
        }, $template ?? '');
    }
}