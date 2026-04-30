<?php
class InvoiceController {

    private static function formatInvoice($inv, $db) {
        if (!$inv) return null;
        $id = (int)$inv['id'];

        $client = null;
        if ($inv['client_id']) {
            $s = $db->prepare("SELECT * FROM users WHERE id = ?"); $s->execute([$inv['client_id']]);
            $client = formatUser($s->fetch());
        }

        $app = null;
        if ($inv['application_id']) {
            $s = $db->prepare("SELECT id, application_id FROM applications WHERE id = ?"); $s->execute([$inv['application_id']]);
            $a = $s->fetch();
            if ($a) $app = ['_id' => (string)$a['id'], 'applicationId' => $a['application_id']];
        }

        $s = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?"); $s->execute([$id]);
        $items = array_map(fn($i) => [
            'description' => $i['description'], 'quantity' => (int)$i['quantity'],
            'rate' => (float)$i['rate'], 'amount' => (float)$i['amount'],
        ], $s->fetchAll());

        return [
            'id' => $id, '_id' => (string)$id,
            'invoiceNumber' => $inv['invoice_number'],
            'application' => $app, 'client' => $client, 'items' => $items,
            'subtotal' => (float)$inv['subtotal'], 'gstPercent' => (float)$inv['gst_percent'],
            'gstAmount' => (float)$inv['gst_amount'], 'discount' => (float)$inv['discount'],
            'total' => (float)$inv['total'], 'status' => $inv['status'],
            'dueDate' => $inv['due_date'], 'paidAt' => $inv['paid_at'],
            'notes' => $inv['notes'], 'pdfPath' => $inv['pdf_path'],
            'createdAt' => $inv['created_at'], 'updatedAt' => $inv['updated_at'],
        ];
    }

    // GET /api/invoices
    public static function getInvoices() {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $status = $_GET['status'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1)); $limit = max(1, (int)($_GET['limit'] ?? 20));

        $where = []; $params = [];
        if ($status) { $where[] = "status = ?"; $params[] = $status; }
        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $db->prepare("SELECT COUNT(*) FROM invoices $whereSQL"); $stmt->execute($params); $total = (int)$stmt->fetchColumn();
        $offset = ($page - 1) * $limit;
        $stmt = $db->prepare("SELECT * FROM invoices $whereSQL ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $invoices = array_map(fn($i) => self::formatInvoice($i, $db), $stmt->fetchAll());

        jsonResponse(['invoices' => $invoices, 'pagination' => ['total' => $total, 'page' => $page, 'pages' => (int)ceil($total / $limit)]]);
    }

    // GET /api/invoices/my
    public static function getMyInvoices() {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC");
        $stmt->execute([Auth::userId()]);
        jsonResponse(['invoices' => array_map(fn($i) => self::formatInvoice($i, $db), $stmt->fetchAll())]);
    }

    // GET /api/invoices/:id
    public static function getInvoiceById($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        $inv = $stmt->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);
        jsonResponse(['invoice' => self::formatInvoice($inv, $db)]);
    }

    // POST /api/invoices
    public static function createInvoice() {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $items = $data['items'] ?? [];
        $gstPercent = $data['gstPercent'] ?? 18;
        $discount = $data['discount'] ?? 0;
        $subtotal = array_sum(array_column($items, 'amount'));
        $gstAmount = ($subtotal * $gstPercent) / 100;
        $total = $subtotal + $gstAmount - $discount;

        // Generate invoice number
        $count = (int)$db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
        $year = date('Y');
        $invoiceNumber = "HS-INV-$year-" . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("INSERT INTO invoices (invoice_number, application_id, client_id, subtotal, gst_percent, gst_amount, discount, total, due_date, notes) VALUES (?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $invoiceNumber, $data['applicationId'] ?? null, $data['clientId'] ?? null,
            $subtotal, $gstPercent, $gstAmount, $discount, $total,
            $data['dueDate'] ?? null, $data['notes'] ?? null,
        ]);
        $id = (int)$db->lastInsertId();

        // Insert items
        $ins = $db->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES (?,?,?,?,?)");
        foreach ($items as $item) {
            $ins->execute([$id, $item['description'], $item['quantity'] ?? 1, $item['rate'], $item['amount']]);
        }

        // Email invoice to client
        if (!empty($data['clientId'])) {
            try {
                $clientStmt = $db->prepare("SELECT name, email FROM users WHERE id = ?");
                $clientStmt->execute([$data['clientId']]);
                $clientRow = $clientStmt->fetch();
                if ($clientRow && $clientRow['email']) {
                    $emailItems = [];
                    foreach ($items as $item) {
                        $emailItems[] = ['description' => $item['description'] ?? '', 'quantity' => $item['quantity'] ?? 1, 'amount' => $item['amount'] ?? 0];
                    }
                    Mailer::sendInvoiceEmail(
                        $clientRow['email'], $clientRow['name'],
                        $invoiceNumber, $total,
                        $data['dueDate'] ?? null,
                        $emailItems, $data['notes'] ?? null
                    );
                }
            } catch (Throwable $e) {
                appLog('error', 'Failed to send invoice email', ['invoiceId' => $id, 'error' => $e->getMessage()]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        jsonResponse(['invoice' => self::formatInvoice($stmt->fetch(), $db)], 201);
    }

    // PUT /api/invoices/:id
    public static function updateInvoice($id) {
        Auth::protect(); Auth::authorize('admin');
        $data = getJsonInput();
        $db = getDb();

        $fields = []; $params = [];
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
        if (isset($data['dueDate'])) { $fields[] = "due_date = ?"; $params[] = $data['dueDate']; }
        if (isset($data['notes'])) { $fields[] = "notes = ?"; $params[] = $data['notes']; }
        if (isset($data['paidAt'])) { $fields[] = "paid_at = ?"; $params[] = $data['paidAt']; }

        if ($fields) { $params[] = $id; $db->prepare("UPDATE invoices SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params); }

        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        $inv = $stmt->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);
        jsonResponse(['invoice' => self::formatInvoice($inv, $db)]);
    }

    // POST /api/invoices/:id/mark-paid
    public static function markPaid($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        $inv = $stmt->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);
        if ($inv['status'] === 'paid') jsonResponse(['error' => 'Invoice already marked as paid'], 400);

        $db->prepare("UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?")->execute([$id]);

        // Send thank-you email to client
        if ($inv['client_id']) {
            try {
                $c = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $c->execute([$inv['client_id']]);
                $client = $c->fetch();
                if ($client && $client['email']) {
                    Mailer::sendThankYouEmail($client['email'], $client['name'], $inv['invoice_number'], (float)$inv['total']);
                }
            } catch (Throwable $e) {
                appLog('error', 'Thank-you email failed', ['invoiceId' => $id, 'error' => $e->getMessage()]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        jsonResponse(['invoice' => self::formatInvoice($stmt->fetch(), $db)]);
    }

    // POST /api/invoices/:id/send-reminder
    public static function sendReminder($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        $inv = $stmt->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);
        if ($inv['status'] === 'paid') jsonResponse(['error' => 'Invoice is already paid'], 400);

        if (!$inv['client_id']) jsonResponse(['error' => 'No client on this invoice'], 400);
        $c = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $c->execute([$inv['client_id']]);
        $client = $c->fetch();
        if (!$client || !$client['email']) jsonResponse(['error' => 'Client email not found'], 400);

        try {
            Mailer::sendPaymentReminderEmail(
                $client['email'], $client['name'],
                $inv['invoice_number'], (float)$inv['total'],
                $inv['due_date']
            );
            jsonResponse(['message' => 'Reminder sent to ' . $client['email']]);
        } catch (Throwable $e) {
            jsonResponse(['error' => 'Failed to send reminder: ' . $e->getMessage()], 500);
        }
    }

    private static function buildInvoiceHtml($formatted) {
        $client = $formatted['client'];
        $items  = $formatted['items'];
        $rs = 'Rs.';
        $itemsHtml = '';
        foreach ($items as $item) {
            $itemsHtml .= '<tr>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">' . htmlspecialchars($item['description']) . '</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center">' . (int)$item['quantity'] . '</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">' . $rs . ' ' . number_format((float)$item['rate'], 2) . '</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">' . $rs . ' ' . number_format((float)$item['amount'], 2) . '</td>
            </tr>';
        }
        // Status label mapping
        $statusLabels = ['draft' => 'DRAFT', 'sent' => 'INVOICE', 'paid' => 'PAID', 'overdue' => 'OVERDUE', 'cancelled' => 'CANCELLED'];
        $statusLabel = $statusLabels[$formatted['status']] ?? strtoupper($formatted['status']);
        $statusColor = $formatted['status'] === 'paid' ? '#10b981' : ($formatted['status'] === 'overdue' ? '#ef4444' : ($formatted['status'] === 'draft' ? '#9ca3af' : '#1a56db'));
        $discountRow = $formatted['discount'] > 0
            ? '<tr><td colspan="3" style="text-align:right;padding:6px 12px;color:#10b981">Discount:</td><td style="text-align:right;padding:6px 12px;color:#10b981">-' . $rs . ' ' . number_format((float)$formatted['discount'], 2) . '</td></tr>'
            : '';

        return '<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"DejaVu Sans",Arial,sans-serif;color:#1f2937;background:#fff;font-size:13px}
  .page{max-width:800px;margin:0 auto;padding:40px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  .brand{font-size:26px;font-weight:bold;color:#1a56db;letter-spacing:-0.5px}
  .brand-sub{font-size:12px;color:#6b7280;margin-top:2px}
  .inv-badge{background:' . $statusColor . ';color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:bold;text-transform:uppercase}
  .inv-title{font-size:22px;font-weight:bold;margin:24px 0 8px}
  .meta-grid{display:flex;gap:40px;margin-bottom:24px}
  .meta-block label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px}
  .meta-block p{font-size:13px;color:#374151;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  thead tr{background:#f9fafb}
  th{padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e5e7eb}
  th:last-child,td:last-child{text-align:right}
  th:nth-child(2),td:nth-child(2){text-align:center}
  .totals-table{width:280px;margin-left:auto;margin-top:8px}
  .totals-table td{padding:5px 12px;font-size:13px}
  .totals-table .grand{font-size:15px;font-weight:bold;border-top:2px solid #1a56db;color:#1a56db}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:11px}
</style>
</head><body><div class="page">
  <div class="header">
    <div>
      <div class="brand">Tax CareerXera</div>
      <div class="brand-sub">128/389 H-2, Block Kidwai Nagar, Kanpur, 208011<br>no-reply@tax.careerxera.com | +91 89249 54143</div>
    </div>
    <div class="inv-badge">' . $statusLabel . '</div>
  </div>
  <div class="inv-title">INVOICE #' . htmlspecialchars($formatted['invoiceNumber']) . '</div>
  <div class="meta-grid">
    <div class="meta-block"><label>Invoice Date</label><p>' . date('d M Y', strtotime($formatted['createdAt'])) . '</p></div>
    <div class="meta-block"><label>Due Date</label><p>' . ($formatted['dueDate'] ? date('d M Y', strtotime($formatted['dueDate'])) : 'N/A') . '</p></div>
    ' . ($formatted['paidAt'] ? '<div class="meta-block"><label>Paid On</label><p>' . date('d M Y', strtotime($formatted['paidAt'])) . '</p></div>' : '') . '
    <div class="meta-block"><label>Bill To</label>
      <p><strong>' . htmlspecialchars($client['name'] ?? 'N/A') . '</strong><br>'
        . htmlspecialchars($client['email'] ?? '') . '<br>'
        . htmlspecialchars($client['phone'] ?? '') . '</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>' . $itemsHtml . '</tbody>
  </table>
  <table class="totals-table">
    <tr><td colspan="3" style="text-align:right;padding:6px 12px;color:#6b7280">Subtotal:</td><td style="text-align:right;padding:6px 12px">' . $rs . ' ' . number_format((float)$formatted['subtotal'], 2) . '</td></tr>
    <tr><td colspan="3" style="text-align:right;padding:6px 12px;color:#6b7280">GST (' . $formatted['gstPercent'] . '%):</td><td style="text-align:right;padding:6px 12px">' . $rs . ' ' . number_format((float)$formatted['gstAmount'], 2) . '</td></tr>
    ' . $discountRow . '
    <tr class="grand"><td colspan="3" style="text-align:right;padding:10px 12px">Total:</td><td style="text-align:right;padding:10px 12px">' . $rs . ' ' . number_format((float)$formatted['total'], 2) . '</td></tr>
  </table>
  ' . ($formatted['notes'] ? '<p style="margin-top:16px;color:#6b7280;font-size:12px"><strong>Notes:</strong> ' . htmlspecialchars($formatted['notes']) . '</p>' : '') . '
  <div class="footer">Thank you for choosing Tax CareerXera! &nbsp;|&nbsp; This is a computer-generated invoice.</div>
</div></body></html>';
    }

    // GET /api/invoices/:id/pdf
    public static function generatePDF($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        $inv = $stmt->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);

        $formatted = self::formatInvoice($inv, $db);
        $html = self::buildInvoiceHtml($formatted);

        // Clear any previously buffered output (e.g. the global JSON Content-Type header)
        if (ob_get_level()) ob_clean();

        // Use Dompdf if available
        $dompdfClass = '\\Dompdf\\Dompdf';
        if (class_exists($dompdfClass)) {
            try {
                $options = new \Dompdf\Options();
                $options->set('isRemoteEnabled', false);
                $options->set('isHtml5ParserEnabled', true);
                $options->set('defaultFont', 'DejaVu Sans');
                $dompdf = new \Dompdf\Dompdf($options);
                $dompdf->loadHtml($html, 'UTF-8');
                $dompdf->setPaper('A4', 'portrait');
                $dompdf->render();
                $pdfOutput = $dompdf->output();
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="' . $inv['invoice_number'] . '.pdf"');
                header('Content-Length: ' . strlen($pdfOutput));
                header('Cache-Control: no-cache, no-store');
                header('Pragma: no-cache');
                echo $pdfOutput;
            } catch (\Throwable $e) {
                // Fallback to HTML if dompdf fails
                header('Content-Type: text/html; charset=utf-8');
                header('Content-Disposition: inline; filename="' . $inv['invoice_number'] . '.html"');
                echo $html;
            }
        } else {
            // Fallback: print-ready HTML
            header('Content-Type: text/html; charset=utf-8');
            header('Content-Disposition: inline; filename="' . $inv['invoice_number'] . '.html"');
            echo $html;
        }
        exit;
    }
}
