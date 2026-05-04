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

    public static function sendPasswordResetEmail($toEmail, $toName, $otp) {
        $subject = 'Password Reset OTP — Tax CareerXera';
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <h2 style="color:#1a56db;margin-bottom:8px">Password Reset</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <p style="color:#374151">We received a request to reset your password. Use the OTP below to proceed:</p>
  <div style="background:#eff6ff;border:2px dashed #1a56db;border-radius:10px;padding:20px;text-align:center;margin:20px 0">
    <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a56db">' . htmlspecialchars($otp) . '</span>
  </div>
  <p style="color:#6b7280;font-size:13px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
  <p style="color:#6b7280;font-size:13px">If you did not request a password reset, please ignore this email. Your password will not change.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Password Reset OTP: $otp\nValid for 10 minutes. Do not share with anyone.\n\ntax.careerxera.com";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendBirthdayEmail($toEmail, $toName) {
        $subject = '🎂 Happy Birthday from Tax CareerXera!';
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:520px;margin:0 auto;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:4px">
<div style="background:#fff;border-radius:10px;padding:32px;text-align:center">
  <div style="font-size:60px;margin-bottom:16px">🎂🎉🎈</div>
  <h1 style="color:#1a56db;font-size:28px;margin-bottom:8px">Happy Birthday!</h1>
  <p style="color:#374151;font-size:16px;margin-bottom:20px">Dear <strong>' . htmlspecialchars($toName ?? $toEmail) . '</strong>,</p>
  <div style="background:linear-gradient(135deg,#667eea22,#764ba222);border-radius:10px;padding:20px;margin:20px 0">
    <p style="color:#4c1d95;font-size:15px;line-height:1.6;margin:0">Wishing you a wonderful birthday filled with joy, happiness, and success! 🌟<br><br>
    Thank you for your amazing dedication and hard work. You make our team shine every day. Have a fantastic day!</p>
  </div>
  <p style="color:#6b7280;font-size:13px">From the entire Tax CareerXera family 💙</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div>
</div></body></html>';
        $text = "Happy Birthday, $toName! 🎂\n\nWishing you a wonderful birthday filled with joy and happiness!\n\nFrom the Tax CareerXera family.\ntax.careerxera.com";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendBirthdayAdminEmail($toEmail, $toName, $employeeName, $employeeEmail) {
        $subject = "🎂 Birthday Today: $employeeName";
        $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <h2 style="color:#1a56db;margin-bottom:4px">🎂 Employee Birthday Today</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName ?? 'Admin') . '</strong>,</p>
  <p style="color:#374151">Today is a special day for one of your team members!</p>
  <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px;margin:16px 0;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">🎉</div>
    <p style="font-size:20px;font-weight:bold;color:#7c3aed;margin:0">' . htmlspecialchars($employeeName) . '</p>
    <p style="color:#6b7280;font-size:13px;margin:4px 0">' . htmlspecialchars($employeeEmail) . '</p>
    <p style="color:#7c3aed;font-size:13px;margin:8px 0">is celebrating their birthday today! 🎂</p>
  </div>
  <p style="color:#374151;font-size:14px">Consider sending them a personal birthday wish to brighten their day!</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Employee Birthday: $employeeName ($employeeEmail) is celebrating their birthday today!\n\ntax.careerxera.com";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    // ===== PARTNER EMAILS =====

    public static function sendPartnerWelcomeEmail($toEmail, $toName) {
        $subject = 'Welcome to Tax CareerXera Associates Partner Program!';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="text-align:center;margin-bottom:24px"><div style="width:56px;height:56px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;display:inline-flex;align-items:center;justify-content:center"><span style="color:white;font-weight:bold;font-size:22px">H</span></div></div>
  <h2 style="color:#1e293b;margin:0 0 16px">Welcome to Associates Partners! 🤝</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">Thank you for registering as an Associates Partner with <strong>Tax CareerXera</strong>. Your application is currently <strong>under review</strong>.</p>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin:16px 0">
    <p style="color:#1d4ed8;font-weight:bold;margin:0 0 8px">What happens next?</p>
    <ol style="color:#374151;margin:0;padding-left:20px;line-height:1.8">
      <li>Our team will review your application</li>
      <li>You may be contacted for additional information</li>
      <li>Once approved, you will receive your rate card</li>
      <li>After accepting the rate card, you can start referring clients!</li>
    </ol>
  </div>
  <p style="color:#374151;font-size:14px">You can log in at any time to check your application status.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Welcome to Tax CareerXera Associates Partners, $toName! Your application is under review.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPartnerAssignedEmail($toEmail, $toName, $partnerName) {
        $subject = 'New Partner Assigned for Review — ' . $partnerName;
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">New Partner Review Assigned 📋</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">A new Associates Partner application has been assigned to you for review:</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:16px 0">
    <p style="font-size:18px;font-weight:bold;color:#15803d;margin:0">' . htmlspecialchars($partnerName) . '</p>
    <p style="color:#6b7280;font-size:13px;margin:4px 0">Please review their profile and provide your assessment.</p>
  </div>
  <p style="color:#374151;font-size:14px">Log in to your dashboard and navigate to the Partner Review Queue to get started.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "New partner assigned for review: $partnerName. Please log in to review.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPartnerApprovedEmail($toEmail, $toName) {
        $subject = '🎉 Congratulations! Your Partner Application is Approved';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="text-align:center;margin-bottom:24px;font-size:48px">🎉</div>
  <h2 style="color:#1e293b;text-align:center">Application Approved!</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">We are thrilled to inform you that your Associates Partner application has been <strong style="color:#16a34a">APPROVED</strong>! Welcome to the Tax CareerXera Partners family.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:16px 0;text-align:center">
    <p style="color:#16a34a;font-weight:bold;font-size:16px;margin:0">Your rate cards are being prepared. You will receive another email once your rate card is ready for your review.</p>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Congratulations $toName! Your Associates Partner application has been approved.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPartnerRejectedEmail($toEmail, $toName, $reason) {
        $subject = 'Update on Your Associates Partner Application';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">Application Status Update</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">After careful review, we are unable to approve your Associates Partner application at this time.</p>
  ' . ($reason ? '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:16px 0"><p style="color:#dc2626;font-weight:bold;margin:0 0 4px">Reason:</p><p style="color:#374151;margin:0">' . htmlspecialchars($reason) . '</p></div>' : '') . '
  <p style="color:#374151;font-size:14px">If you believe this is an error or would like to reapply, please contact our support team.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Your Associates Partner application status update: $toName. Please log in for details.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPartnerNeedsUpdateEmail($toEmail, $toName, $comments) {
        $subject = 'Action Required: Update Your Partner Application';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">⚠️ Application Update Required</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">Our team has reviewed your application and needs some additional information or updates before we can proceed.</p>
  ' . ($comments ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:16px 0"><p style="color:#92400e;font-weight:bold;margin:0 0 4px">What\'s needed:</p><p style="color:#374151;margin:0">' . htmlspecialchars($comments) . '</p></div>' : '') . '
  <p style="color:#374151;font-size:14px">Please log in to your partner dashboard and update your profile accordingly.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Action required for your partner application, $toName. Please log in and update your profile.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPartnerReviewedAdminEmail($toEmail, $toName, $partnerName, $reviewerName) {
        $subject = 'Partner Reviewed — Ready for Admin Approval: ' . $partnerName;
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">Partner Ready for Admin Approval 🔔</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151"><strong>' . htmlspecialchars($reviewerName) . '</strong> has reviewed the partner application for <strong>' . htmlspecialchars($partnerName) . '</strong> and it is now awaiting your final approval.</p>
  <p style="color:#374151;font-size:14px">Log in to the admin panel to approve or reject this application.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Partner $partnerName has been reviewed by $reviewerName and is awaiting admin approval.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendRateCardCreatedEmail($toEmail, $toName, $serviceName, $partnerPrice) {
        $subject = 'New Rate Card Available for Your Review — ' . $serviceName;
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">New Rate Card for Review 📄</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">A new rate card has been created for you:</p>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin:16px 0">
    <p style="font-size:16px;font-weight:bold;color:#1d4ed8;margin:0 0 8px">' . htmlspecialchars($serviceName) . '</p>
    <p style="color:#374151;margin:0">Your Partner Price: <strong>₹' . number_format($partnerPrice, 2) . '</strong></p>
  </div>
  <p style="color:#374151;font-size:14px">Please log in to your partner dashboard to review and accept or reject this rate card.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "A new rate card has been created for $serviceName at ₹$partnerPrice. Please log in to review.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendRateCardApprovedEmail($toEmail, $toName, $serviceName) {
        $subject = '✅ Rate Card Approved — ' . $serviceName;
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">Rate Card Approved ✅</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">Your rate card for <strong>' . htmlspecialchars($serviceName) . '</strong> has been <strong style="color:#16a34a">APPROVED</strong>. You can now start referring clients for this service!</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "Your rate card for $serviceName has been approved! You can now refer clients.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendRateCardRejectedEmail($toEmail, $toName, $serviceName, $reason) {
        $subject = 'Rate Card Update — ' . $serviceName;
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">Rate Card Not Approved</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151">The rate card for <strong>' . htmlspecialchars($serviceName) . '</strong> has been rejected.</p>
  ' . ($reason ? '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:16px 0"><p style="color:#dc2626;font-weight:bold;margin:0 0 4px">Reason:</p><p style="color:#374151;margin:0">' . htmlspecialchars($reason) . '</p></div>' : '') . '
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "The rate card for $serviceName has been rejected.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendRateCardPartnerRespondedEmail($toEmail, $toName, $partnerName, $serviceName, $action) {
        $subject = "Partner $action rate card — $serviceName";
        $actionText = $action === 'accept' ? 'ACCEPTED ✅' : 'REJECTED ❌';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="color:#1e293b">Partner Rate Card Response</h2>
  <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
  <p style="color:#374151"><strong>' . htmlspecialchars($partnerName) . '</strong> has <strong>' . $actionText . '</strong> the rate card for <strong>' . htmlspecialchars($serviceName) . '</strong>.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
  <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
</div></body></html>';
        $text = "$partnerName has $action the rate card for $serviceName.";
        self::send($toEmail, $toName, $subject, $html, $text);
    }

    public static function sendPartnerServiceRequestConfirmation($toEmail, $toName, $serviceName, $ref) {
        $subject = "Service Request Received — $ref";
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e293b">Service Request Submitted ✅</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151">Your service request for <strong>' . htmlspecialchars($serviceName) . '</strong> has been received.</p>
    <p style="color:#374151">Reference: <strong>' . htmlspecialchars($ref) . '</strong></p>
    <p style="color:#374151">Our team will review it shortly and update you.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "Service request $ref received for $serviceName.");
    }

    public static function sendPartnerServiceRequestAdminNotify($toEmail, $toName, $partnerName, $serviceName, $ref) {
        $subject = "New Partner Service Request — $ref";
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e293b">New Partner Service Request</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151">Partner <strong>' . htmlspecialchars($partnerName) . '</strong> submitted a service request for <strong>' . htmlspecialchars($serviceName) . '</strong>.</p>
    <p style="color:#374151">Reference: <strong>' . htmlspecialchars($ref) . '</strong></p>
    <p style="margin-top:16px"><a href="https://tax.careerxera.com/admin/partner-requests" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Review Request</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "New service request $ref from $partnerName.");
    }

    public static function sendPartnerRequestStatusUpdate($toEmail, $toName, $ref, $status, $comments = '') {
        $labels = ['under-review'=>'Under Review','in-progress'=>'In Progress','completed'=>'Completed','rejected'=>'Rejected','cancelled'=>'Cancelled'];
        $label  = $labels[$status] ?? ucfirst($status);
        $subject = "Service Request $ref — $label";
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e293b">Service Request Update</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151">Your service request <strong>' . htmlspecialchars($ref) . '</strong> has been updated to <strong>' . htmlspecialchars($label) . '</strong>.</p>'
    . ($comments ? '<p style="color:#374151">Note: ' . htmlspecialchars($comments) . '</p>' : '') .
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "Request $ref is now $label.");
    }

    public static function sendPartnerCredentialsEmail($toEmail, $toName, $loginEmail, $plainPassword) {
        $subject = 'Your Associate Partner Account – Tax CareerXera';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e3a5f;margin-top:0">Welcome to Tax CareerXera!</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151">Your Associate Partner account has been created. You can log in immediately using the credentials below:</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0 0 8px;color:#374151"><strong>Login URL:</strong> <a href="https://tax.careerxera.com/login" style="color:#3b82f6">tax.careerxera.com/login</a></p>
      <p style="margin:0 0 8px;color:#374151"><strong>Email:</strong> ' . htmlspecialchars($loginEmail) . '</p>
      <p style="margin:0;color:#374151"><strong>Password:</strong> <span style="font-family:monospace;background:#e5e7eb;padding:2px 8px;border-radius:4px">' . htmlspecialchars($plainPassword) . '</span></p>
    </div>
    <p style="color:#374151">Please log in and change your password from your profile settings.</p>
    <p style="margin-top:20px"><a href="https://tax.careerxera.com/login" style="background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Log In Now</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "Your login: $loginEmail / Password: $plainPassword — tax.careerxera.com/login");
    }

    public static function sendRateCardBulkAssignedEmail($toEmail, $toName, $count) {
        $subject = 'Rate Card(s) Assigned – Tax CareerXera';
        $html = '<html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e3a5f;margin-top:0">Rate Card Assignment</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151"><strong>' . (int)$count . ' rate card(s)</strong> have been assigned to your account. Please log in to review and accept or reject them.</p>
    <p style="margin-top:20px"><a href="https://tax.careerxera.com/partner/rate-cards" style="background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">View Rate Cards</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "$count rate card(s) have been assigned to your partner account.");
    }

    public static function sendPartnerInvoiceEmail($toEmail, $toName, $invNumber, $total, $dueDate, $periodStart, $periodEnd, $items) {
        $subject = "Invoice $invNumber – Tax CareerXera";
        $itemRows = '';
        foreach ($items as $item) {
            $itemRows .= '<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' . htmlspecialchars($item['description'] ?? '') . '</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">' . number_format((float)($item['amount'] ?? 0), 2) . '</td>
            </tr>';
        }
        $html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e3a5f;margin-top:0">Invoice ' . htmlspecialchars($invNumber) . '</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151">Please find your invoice for the period <strong>' . htmlspecialchars($periodStart) . '</strong> to <strong>' . htmlspecialchars($periodEnd) . '</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead><tr style="background:#f3f4f6">
        <th style="padding:10px 12px;text-align:left;color:#374151">Description</th>
        <th style="padding:10px 12px;text-align:right;color:#374151">Amount (₹)</th>
      </tr></thead>
      <tbody>' . $itemRows . '</tbody>
      <tfoot><tr style="background:#1e3a5f">
        <td style="padding:10px 12px;color:#fff;font-weight:bold">Total</td>
        <td style="padding:10px 12px;color:#fff;font-weight:bold;text-align:right">₹' . number_format((float)$total, 2) . '</td>
      </tr></tfoot>
    </table>
    <p style="color:#374151"><strong>Due Date:</strong> ' . htmlspecialchars($dueDate) . '</p>
    <p style="color:#374151">Please log in to your partner portal to view and download the full invoice PDF.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "Invoice $invNumber for ₹" . number_format((float)$total, 2) . " is due on $dueDate.");
    }

    public static function sendPartnerPaymentConfirmed($toEmail, $toName, $invNumber, $amount, $totalPaid, $invoiceTotal) {
        $balance = (float)$invoiceTotal - (float)$totalPaid;
        $fullyPaid = $balance <= 0;
        $subject = $fullyPaid ? "Payment Received – Invoice $invNumber Cleared" : "Payment of ₹" . number_format((float)$amount, 2) . " Recorded – Invoice $invNumber";
        $html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#1e3a5f;margin-top:0">Payment Confirmation</h2>
    <p style="color:#374151">Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
    <p style="color:#374151">We have recorded a payment of <strong>₹' . number_format((float)$amount, 2) . '</strong> against invoice <strong>' . htmlspecialchars($invNumber) . '</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr><td style="padding:8px 12px;color:#374151">Invoice Total</td><td style="padding:8px 12px;text-align:right;color:#374151">₹' . number_format((float)$invoiceTotal, 2) . '</td></tr>
      <tr><td style="padding:8px 12px;color:#374151">Total Paid</td><td style="padding:8px 12px;text-align:right;color:#374151">₹' . number_format((float)$totalPaid, 2) . '</td></tr>
      <tr style="background:' . ($fullyPaid ? '#dcfce7' : '#fef9c3') . '"><td style="padding:8px 12px;font-weight:bold">Balance Due</td><td style="padding:8px 12px;text-align:right;font-weight:bold">₹' . number_format(max(0, $balance), 2) . '</td></tr>
    </table>
    ' . ($fullyPaid ? '<p style="color:#16a34a;font-weight:bold">✓ Invoice fully cleared. Thank you!</p>' : '<p style="color:#374151">Please arrange the remaining balance at your earliest convenience.</p>') . '
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="color:#9ca3af;font-size:12px">Tax CareerXera | tax.careerxera.com</p>
  </div></body></html>';
        self::send($toEmail, $toName, $subject, $html, "Payment of ₹" . number_format((float)$amount, 2) . " recorded for invoice $invNumber.");
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