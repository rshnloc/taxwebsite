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

    // GET /api/invoices/:id/pdf
    public static function generatePDF($id) {
        Auth::protect();
        $db = getDb();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?"); $stmt->execute([$id]);
        $inv = $stmt->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);

        // Simple HTML-to-PDF approach (no pdfkit in PHP, generate HTML for download)
        $formatted = self::formatInvoice($inv, $db);
        $client = $formatted['client'];
        $items = $formatted['items'];

        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . $inv['invoice_number'] . '.html');

        $itemsHtml = '';
        foreach ($items as $item) {
            $itemsHtml .= "<tr><td>{$item['description']}</td><td style='text-align:center'>{$item['quantity']}</td><td style='text-align:right'>₹" . number_format($item['rate'], 2) . "</td><td style='text-align:right'>₹" . number_format($item['amount'], 2) . "</td></tr>";
        }

        echo "<!DOCTYPE html><html><head><title>{$inv['invoice_number']}</title>
<style>body{font-family:Arial;margin:40px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd}th{background:#f5f5f5}.header{display:flex;justify-content:space-between}.totals{text-align:right}</style></head><body>
<h1>HELPSHACK</h1><p>128/389 H-2, Block Kidwai Nagar, Kanpur, 208011<br>Email: dhirajame89@gmail.com | Phone: +91 89249 54143</p><hr>
<h2>INVOICE #{$inv['invoice_number']}</h2>
<p>Date: " . date('d/m/Y', strtotime($inv['created_at'])) . "<br>
Due Date: " . ($inv['due_date'] ? date('d/m/Y', strtotime($inv['due_date'])) : 'N/A') . "<br>
Status: " . strtoupper($inv['status']) . "</p>
<h3>Bill To:</h3><p>" . ($client['name'] ?? 'N/A') . "<br>" . ($client['companyName'] ?? '') . "<br>" . ($client['email'] ?? '') . "<br>" . ($client['phone'] ?? '') . "</p>
<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>$itemsHtml</tbody></table>
<div class='totals'><p>Subtotal: ₹" . number_format($formatted['subtotal'], 2) . "<br>GST ({$formatted['gstPercent']}%): ₹" . number_format($formatted['gstAmount'], 2) . ($formatted['discount'] > 0 ? "<br>Discount: -₹" . number_format($formatted['discount'], 2) : '') . "<br><strong>Total: ₹" . number_format($formatted['total'], 2) . "</strong></p></div>
<hr><p style='text-align:center;color:#666'>Thank you for choosing Helpshack! This is a computer-generated invoice.</p></body></html>";
        exit;
    }
}
