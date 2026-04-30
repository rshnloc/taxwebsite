<?php

// Explicitly load PHPMailer in case autoload hasn't registered it yet
$_phpmailerBase = __DIR__ . '/../vendor/phpmailer/phpmailer/src/';
if (is_dir($_phpmailerBase) && !class_exists('PHPMailer\\PHPMailer\\PHPMailer', false)) {
    require_once $_phpmailerBase . 'Exception.php';
    require_once $_phpmailerBase . 'PHPMailer.php';
    require_once $_phpmailerBase . 'SMTP.php';
}

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
        $fromName  = $config['MAIL_FROM_NAME']  ?? 'Tax CareerXera';

        // ── Use PHPMailer SMTP if configured ────────────────────────
        $smtpHost = $config['MAIL_SMTP_HOST'] ?? '';
        $smtpUser = $config['MAIL_SMTP_USER'] ?? '';
        $smtpPass = $config['MAIL_SMTP_PASS'] ?? '';
        $smtpPort = (int)($config['MAIL_SMTP_PORT'] ?? 465);
        $smtpEnc  = $config['MAIL_SMTP_ENC'] ?? 'ssl';

        if ($smtpHost && $smtpUser && $smtpPass && $smtpPass !== 'YOUR_EMAIL_PASSWORD') {
            // PHPMailer SMTP
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $smtpHost;
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpUser;
            $mail->Password   = $smtpPass;
            $mail->Port       = $smtpPort;
            $mail->SMTPSecure = $smtpEnc === 'tls'
                ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS
                : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;
            // Capture debug output to log instead of stdout
            $debugLog = '';
            $mail->SMTPDebug  = 2;
            $mail->Debugoutput = function($str, $level) use (&$debugLog) { $debugLog .= $str . "\n"; };

            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($toEmail, $toName ?? '');
            $mail->Subject = $subject;

            if ($bodyHtml) {
                $mail->isHTML(true);
                $mail->Body    = $bodyHtml;
                $mail->AltBody = $bodyText ?: strip_tags($bodyHtml);
            } else {
                $mail->isHTML(false);
                $mail->Body = $bodyText;
            }

            try {
                $mail->send();
                appLog('info', 'SMTP email sent', ['to' => $toEmail, 'subject' => $subject]);
            } catch (\Exception $e) {
                appLog('error', 'SMTP send failed', [
                    'to'     => $toEmail,
                    'error'  => $mail->ErrorInfo,
                    'debug'  => $debugLog,
                    'host'   => $smtpHost,
                    'port'   => $smtpPort,
                    'user'   => $smtpUser,
                ]);
                throw new \RuntimeException('SMTP Error: ' . $mail->ErrorInfo . ' | Debug: ' . substr($debugLog, 0, 500));
            }
        } else {
            // Fallback: PHP mail() — only works if server allows it
            $headers = [
                'MIME-Version: 1.0',
                'Content-type: text/html; charset=UTF-8',
                'From: ' . $fromName . ' <' . $fromEmail . '>',
            ];
            $recipient = $toName ? sprintf('%s <%s>', $toName, $toEmail) : $toEmail;
            if (!mail($recipient, $subject, nl2br($bodyHtml ?: $bodyText), implode("\r\n", $headers))) {
                throw new RuntimeException('mail() returned false — configure SMTP in config.php');
            }
        }
    }

    public static function sendStatusUpdateEmail($toEmail, $toName, $applicationId, $status, $remarks, $isAdmin = false, $clientName = null) {
        $statusColors = [
            'completed' => '#10b981', 'in-progress' => '#3b82f6', 'rejected' => '#ef4444',
            'cancelled' => '#6b7280', 'under-review' => '#f59e0b', 'pending-documents' => '#f97316',
            'submitted' => '#8b5cf6',
        ];
        $color = $statusColors[$status] ?? '#3b82f6';
        $statusLabel = ucwords(str_replace('-', ' ', $status));

        if ($isAdmin) {
            $subject = "Application $applicationId — Status changed to $statusLabel";
            $greeting = "Hi " . htmlspecialchars($toName ?? 'Admin') . ",";
            $intro = "Application <strong>$applicationId</strong>" . ($clientName ? " (Client: " . htmlspecialchars($clientName) . ")" : "") . " status was updated.";
        } else {
            $subject = "Your application $applicationId has been updated — $statusLabel";
            $greeting = "Hi " . htmlspecialchars($toName ?? 'Valued Client') . ",";
            $intro = "Your application <strong>$applicationId</strong> has been updated.";
        }

        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <h2 style="color:#1a56db;margin-bottom:4px">Tax CareerXera</h2>
  <p style="color:#374151">' . $greeting . '</p>
  <p style="color:#374151">' . $intro . '</p>
  <div style="margin:20px 0;padding:16px;border-left:4px solid ' . $color . ';background:#f9fafb;border-radius:0 8px 8px 0">
    <div style="font-size:13px;color:#6b7280;margin-bottom:6px">New Status</div>
    <div style="font-size:18px;font-weight:bold;color:' . $color . '">' . htmlspecialchars($statusLabel) . '</div>
  </div>
  ' . ($remarks ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:16px">
    <div style="font-size:12px;font-weight:bold;color:#92400e;margin-bottom:4px">REMARKS</div>
    <p style="color:#374151;margin:0">' . htmlspecialchars($remarks) . '</p>
  </div>' : '') . '
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';

        $text = "$greeting\n\n$applicationId status updated to: $statusLabel\n\nRemarks: $remarks\n\ntax.careerxera.com";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendTaskAssignedEmail($toEmail, $toName, $taskTitle, $taskDesc, $priority, $dueDate, $appId = null, $clientName = null) {
        $priorityColors = ['urgent' => '#ef4444', 'high' => '#f97316', 'medium' => '#f59e0b', 'low' => '#10b981'];
        $color = $priorityColors[$priority] ?? '#3b82f6';
        $subject = "New Task Assigned: $taskTitle";
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <h2 style="color:#1a56db;margin-bottom:4px">New Task Assigned</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>, a new task has been assigned to you.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0">
    <div style="font-size:17px;font-weight:bold;color:#1e293b;margin-bottom:8px">' . htmlspecialchars($taskTitle) . '</div>
    ' . ($taskDesc ? '<p style="color:#64748b;font-size:14px;margin:0 0 12px 0">' . htmlspecialchars($taskDesc) . '</p>' : '') . '
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <span style="font-size:12px;background:' . $color . '22;color:' . $color . ';border-radius:999px;padding:3px 10px;font-weight:600">' . ucfirst($priority) . ' Priority</span>
      ' . ($dueDate ? '<span style="font-size:12px;color:#64748b">Due: ' . htmlspecialchars($dueDate) . '</span>' : '') . '
      ' . ($appId ? '<span style="font-size:12px;color:#64748b">App: ' . htmlspecialchars($appId) . '</span>' : '') . '
      ' . ($clientName ? '<span style="font-size:12px;color:#64748b">Client: ' . htmlspecialchars($clientName) . '</span>' : '') . '
    </div>
  </div>
  <p style="color:#6b7280;font-size:13px">Login to your dashboard to view details and update progress.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "New Task Assigned: $taskTitle\nPriority: $priority\nDue: $dueDate\n\n$taskDesc\n\ntax.careerxera.com";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendOtpEmail($toEmail, $toName, $otp) {
        $subject = 'Your OTP for Tax CareerXera — ' . $otp;
        $html = '
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <h2 style="color:#1a56db;margin-bottom:8px">Tax CareerXera</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <p style="color:#374151">Your One-Time Password (OTP) for email verification is:</p>
  <div style="background:#eff6ff;border:2px dashed #1a56db;border-radius:10px;padding:20px;text-align:center;margin:20px 0">
    <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a56db">' . htmlspecialchars($otp) . '</span>
  </div>
  <p style="color:#6b7280;font-size:13px">This OTP is valid for <strong>15 minutes</strong>. Do not share it with anyone.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">If you did not request this, please ignore this email.</p>
</div>
</body></html>';
        $text = "Your OTP for Tax CareerXera is: $otp\nValid for 15 minutes.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendInvoiceEmail($toEmail, $toName, $invoiceNumber, $total, $dueDate, $items = [], $notes = null) {
        $subject = "Invoice $invoiceNumber – Tax CareerXera";
        $itemRows = '';
        foreach ($items as $item) {
            $itemRows .= '<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">' . htmlspecialchars($item['description'] ?? '') . '</td>'
                . '<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">' . htmlspecialchars($item['quantity'] ?? 1) . '</td>'
                . '<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹' . number_format((float)($item['amount'] ?? 0), 2) . '</td></tr>';
        }
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1a56db;margin-bottom:8px">Tax CareerXera – Invoice</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <p style="color:#374151">A new invoice has been generated for you. Please find the details below.</p>
  <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:16px 0">
    <p style="margin:4px 0;color:#1e40af"><strong>Invoice Number:</strong> ' . htmlspecialchars($invoiceNumber) . '</p>
    <p style="margin:4px 0;color:#1e40af"><strong>Due Date:</strong> ' . htmlspecialchars($dueDate ?? 'N/A') . '</p>
    <p style="margin:4px 0;color:#1e40af"><strong>Total Amount:</strong> ₹' . number_format((float)$total, 2) . '</p>
  </div>'
  . ($itemRows ? '<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr style="background:#f9fafb"><th style="padding:8px;text-align:left;color:#6b7280;font-size:13px">Description</th><th style="padding:8px;color:#6b7280;font-size:13px">Qty</th><th style="padding:8px;text-align:right;color:#6b7280;font-size:13px">Amount</th></tr></thead><tbody>' . $itemRows . '</tbody></table>' : '')
  . ($notes ? '<p style="color:#374151;font-size:13px"><strong>Notes:</strong> ' . htmlspecialchars($notes) . '</p>' : '')
  . '<p style="color:#374151;margin-top:16px">Please log in to your account to view and download the full invoice.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">This is an automated message from Tax CareerXera. Please do not reply to this email.</p>
</div></body></html>';
        $text = "Invoice $invoiceNumber\nTotal: ₹" . number_format((float)$total, 2) . "\nDue: " . ($dueDate ?? 'N/A') . "\nPlease log in to view details.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendChatNotificationEmail($toEmail, $toName, $senderName, $message, $roomId = null) {
        $subject = "New Message from $senderName – Tax CareerXera";
        $preview = mb_strlen($message) > 150 ? mb_substr($message, 0, 147) . '...' : $message;
        $chatLink = $roomId ? "/dashboard/chat?room=$roomId" : "/dashboard/chat";
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1a56db;margin-bottom:8px">New Message – Tax CareerXera</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <p style="color:#374151">You have received a new message from <strong>' . htmlspecialchars($senderName) . '</strong>:</p>
  <div style="background:#f9fafb;border-left:4px solid #1a56db;border-radius:4px;padding:12px 16px;margin:16px 0;color:#374151;font-style:italic">' . htmlspecialchars($preview) . '</div>
  <p style="color:#374151">Please log in to view and reply to this message.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">This is an automated message from Tax CareerXera. Please do not reply to this email.</p>
</div></body></html>';
        $text = "New message from $senderName:\n\n$preview\n\nPlease log in to reply.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPaymentReminderEmail($toEmail, $toName, $invoiceNumber, $total, $dueDate) {
        $subject = "Payment Reminder: Invoice #$invoiceNumber – Tax CareerXera";
        $dueFmt = $dueDate ? date('d M Y', strtotime($dueDate)) : 'N/A';
        $totalFmt = '₹' . number_format($total, 2);
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#ef4444;margin-bottom:8px">⚠️ Payment Reminder</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <p style="color:#374151">This is a friendly reminder that the following invoice is still outstanding:</p>
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="color:#6b7280;padding:4px 0">Invoice Number:</td><td style="font-weight:bold;text-align:right">#' . htmlspecialchars($invoiceNumber) . '</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Amount Due:</td><td style="font-weight:bold;font-size:18px;color:#ef4444;text-align:right">' . $totalFmt . '</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Due Date:</td><td style="font-weight:bold;text-align:right">' . $dueFmt . '</td></tr>
    </table>
  </div>
  <p style="color:#374151">Please log in to your account to complete the payment at your earliest convenience.</p>
  <p style="margin-top:24px"><a href="https://tax.careerxera.com/dashboard/invoices" style="background:#1a56db;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">View Invoice</a></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">If you have already made payment, please ignore this reminder. For queries, contact us at no-reply@tax.careerxera.com.</p>
</div></body></html>';
        $text = "Payment Reminder – Invoice #$invoiceNumber\nAmount: $totalFmt\nDue: $dueFmt\n\nPlease visit https://tax.careerxera.com/dashboard/invoices to pay.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendThankYouEmail($toEmail, $toName, $invoiceNumber, $total) {
        $subject = "Payment Received – Invoice #$invoiceNumber | Tax CareerXera";
        $totalFmt = '₹' . number_format($total, 2);
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#10b981;margin-bottom:8px">✅ Payment Received – Thank You!</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <p style="color:#374151">We have successfully received your payment. Thank you for choosing Tax CareerXera!</p>
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="color:#6b7280;padding:4px 0">Invoice Number:</td><td style="font-weight:bold;text-align:right">#' . htmlspecialchars($invoiceNumber) . '</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Amount Paid:</td><td style="font-weight:bold;font-size:18px;color:#10b981;text-align:right">' . $totalFmt . '</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Status:</td><td style="font-weight:bold;color:#10b981;text-align:right">PAID ✓</td></tr>
    </table>
  </div>
  <p style="color:#374151">Our team will continue to work diligently on your case. You can track your service progress from your dashboard.</p>
  <p style="margin-top:24px"><a href="https://tax.careerxera.com/dashboard" style="background:#1a56db;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Go to Dashboard</a></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">This is an automated confirmation. For support, reach us at no-reply@tax.careerxera.com.</p>
</div></body></html>';
        $text = "Payment Confirmed – Invoice #$invoiceNumber\nAmount Paid: $totalFmt\nStatus: PAID\n\nThank you for your payment. Visit https://tax.careerxera.com/dashboard to track your services.";
        self::send($toEmail, $toName, $subject, $html, $text);
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