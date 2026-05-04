<?php
class PartnerInvoiceController {

    // ============================================================
    // PUBLIC API METHODS
    // ============================================================

    // GET /api/partner-invoices  (admin sees all; partner sees own)
    public static function getAll() {
        $user = Auth::protect();
        $db   = getDb();

        $page   = max(1, (int)($_GET['page']   ?? 1));
        $limit  = min(100, (int)($_GET['limit'] ?? 20));
        $offset = ($page - 1) * $limit;
        $status = $_GET['status']    ?? '';
        $search = $_GET['search']    ?? '';
        $period = $_GET['period']    ?? '';    // YYYY-MM

        $where = []; $params = [];

        if ($user['role'] === 'partner') {
            $where[] = "pi.partner_id = ?"; $params[] = $user['id'];
        } elseif (!in_array($user['role'], ['admin','employee'])) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }

        // Filters
        if ($status) { $where[] = "pi.status = ?"; $params[] = $status; }
        if ($search) {
            $where[] = "(pi.invoice_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
            $q = "%$search%"; $params = array_merge($params, [$q,$q,$q]);
        }
        if ($period) {
            $where[] = "DATE_FORMAT(pi.billing_period_start,'%Y-%m') = ?"; $params[] = $period;
        }

        $whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $countSql = "SELECT COUNT(*) FROM partner_invoices pi LEFT JOIN users u ON u.id = pi.partner_id $whereStr";
        $cStmt    = $db->prepare($countSql); $cStmt->execute($params); $total = (int)$cStmt->fetchColumn();

        $sql   = "SELECT pi.*, u.name AS partner_name, u.email AS partner_email
                  FROM partner_invoices pi
                  LEFT JOIN users u ON u.id = pi.partner_id
                  $whereStr ORDER BY pi.created_at DESC LIMIT $limit OFFSET $offset";
        $stmt  = $db->prepare($sql); $stmt->execute($params);
        $rows  = $stmt->fetchAll();

        jsonResponse([
            'invoices'   => array_map(fn($r) => self::format($r, $db), $rows),
            'total'      => $total,
            'page'       => $page,
            'pages'      => (int)ceil($total / max(1,$limit)),
        ]);
    }

    // GET /api/partner-invoices/:id
    public static function getById($id) {
        $user = Auth::protect();
        $db   = getDb();
        $row  = self::fetchRow($db, $id);
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        if ($user['role'] === 'partner' && (int)$row['partner_id'] !== $user['id']) jsonResponse(['error' => 'Forbidden'], 403);
        jsonResponse(['invoice' => self::format($row, $db, true)]);
    }

    // POST /api/admin/partner-invoices — manual creation
    public static function create() {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();

        $partnerId        = (int)($data['partnerId']       ?? 0);
        $paymentAccountId = (int)($data['paymentAccountId'] ?? 0);
        $periodStart      = $data['billingPeriodStart'] ?? '';
        $periodEnd        = $data['billingPeriodEnd']   ?? '';
        $gstPercent       = (float)($data['gstPercent'] ?? 18);
        $discount         = (float)($data['discount']   ?? 0);
        $extraCharges     = (float)($data['extraCharges'] ?? 0);
        $extraNote        = $data['extraChargesNote'] ?? '';
        $adminNotes       = $data['adminNotes'] ?? '';
        $dueDate          = $data['dueDate'] ?? null;
        $items            = $data['items'] ?? [];

        if (!$partnerId)   jsonResponse(['error' => 'partnerId is required'], 422);
        if (!$periodStart) jsonResponse(['error' => 'billingPeriodStart is required'], 422);
        if (!$periodEnd)   jsonResponse(['error' => 'billingPeriodEnd is required'], 422);
        if (empty($items)) jsonResponse(['error' => 'At least one item is required'], 422);

        // Verify partner exists
        $p = $db->prepare("SELECT id, name FROM users WHERE id = ? AND role = 'partner' AND is_active = 1"); $p->execute([$partnerId]);
        if (!$p->fetch()) jsonResponse(['error' => 'Partner not found'], 404);

        $invNumber = self::generateInvoiceNumber($db, 'PINV');
        $subtotal  = self::calcSubtotal($items);
        $gstAmt    = round($subtotal * $gstPercent / 100, 2);
        $total     = round($subtotal + $gstAmt - $discount + $extraCharges, 2);

        $stmt = $db->prepare("
            INSERT INTO partner_invoices
                (invoice_number, partner_id, billing_period_start, billing_period_end,
                 payment_account_id, subtotal, gst_percent, gst_amount, discount,
                 extra_charges, extra_charges_note, total, status, admin_notes,
                 due_date, created_by, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'finalized',?,?,?,NOW(),NOW())
        ");
        $stmt->execute([$invNumber, $partnerId, $periodStart, $periodEnd,
            $paymentAccountId ?: null, $subtotal, $gstPercent, $gstAmt, $discount,
            $extraCharges, $extraNote, $total, $adminNotes, $dueDate, $user['id']]);
        $invId = (int)$db->lastInsertId();

        self::insertItems($db, $invId, $items);

        $inv = self::format(self::fetchRow($db, $invId), $db, true);
        jsonResponse(['invoice' => $inv], 201);
    }

    // POST /api/admin/partner-invoices/auto-generate
    public static function autoGenerate() {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();

        // Default: previous calendar month
        $year     = (int)($_POST['year']  ?? $_GET['year']  ?? date('Y'));
        $month    = (int)($_POST['month'] ?? $_GET['month'] ?? (int)date('m') - 1);
        if ($month < 1) { $month = 12; $year--; }
        $data     = getJsonInput();
        if (!empty($data['year']))  $year  = (int)$data['year'];
        if (!empty($data['month'])) $month = (int)$data['month'];

        $periodStart = sprintf('%04d-%02d-01', $year, $month);
        $periodEnd   = date('Y-m-t', strtotime($periodStart));

        // Get all approved partners who have service requests in this period
        $sql = "
            SELECT DISTINCT psr.partner_id
            FROM partner_service_requests psr
            JOIN users u ON u.id = psr.partner_id
            WHERE psr.status IN ('completed','in-progress','submitted','under-review')
              AND psr.created_at >= ? AND psr.created_at <= ?
              AND u.partner_status = 'approved'
        ";
        $s = $db->prepare($sql); $s->execute([$periodStart . ' 00:00:00', $periodEnd . ' 23:59:59']);
        $partnerIds = array_column($s->fetchAll(), 'partner_id');

        if (empty($partnerIds)) {
            jsonResponse(['message' => 'No partner activity found for this period', 'generated' => 0]);
        }

        $generated = []; $skipped = [];
        foreach ($partnerIds as $partnerId) {
            // Skip if invoice already exists for this partner + period
            $exists = $db->prepare("SELECT id FROM partner_invoices WHERE partner_id = ? AND billing_period_start = ? AND status NOT IN ('cancelled')");
            $exists->execute([$partnerId, $periodStart]);
            if ($exists->fetch()) { $skipped[] = $partnerId; continue; }

            // Fetch service requests for this partner in period
            $reqs = $db->prepare("
                SELECT psr.id, psr.service_id, psr.agreed_price, psr.client_name, psr.reference,
                       s.name AS service_name,
                       prc.partner_price AS rate_card_price
                FROM partner_service_requests psr
                LEFT JOIN services s ON s.id = psr.service_id
                LEFT JOIN partner_rate_cards prc ON prc.id = psr.rate_card_id
                WHERE psr.partner_id = ?
                  AND psr.status IN ('completed','in-progress','submitted','under-review')
                  AND psr.created_at >= ? AND psr.created_at <= ?
            ");
            $reqs->execute([$partnerId, $periodStart . ' 00:00:00', $periodEnd . ' 23:59:59']);
            $requests = $reqs->fetchAll();
            if (empty($requests)) continue;

            // Build items
            $items = [];
            foreach ($requests as $req) {
                $price = (float)($req['rate_card_price'] ?? $req['agreed_price']);
                $items[] = [
                    'serviceRequestId' => (int)$req['id'],
                    'serviceId'        => (int)$req['service_id'],
                    'description'      => $req['service_name'] . ' — ' . $req['client_name'] . ' (' . $req['reference'] . ')',
                    'quantity'         => 1,
                    'rate'             => $price,
                    'amount'           => $price,
                    'itemType'         => 'service',
                ];
            }

            // Get default payment account
            $defAcc = $db->query("SELECT id FROM payment_accounts WHERE is_default = 1 AND is_active = 1 LIMIT 1")->fetch();
            $paymentAccountId = $defAcc ? (int)$defAcc['id'] : null;

            $invNumber = self::generateInvoiceNumber($db, 'PINV');
            $subtotal  = self::calcSubtotal($items);
            $gstPct    = 0; // Partner invoices typically no GST by default, admin can adjust
            $gstAmt    = round($subtotal * $gstPct / 100, 2);
            $total     = round($subtotal + $gstAmt, 2);
            $dueDate   = date('Y-m-d', strtotime('+15 days'));

            $stmt = $db->prepare("
                INSERT INTO partner_invoices
                    (invoice_number, partner_id, billing_period_start, billing_period_end,
                     payment_account_id, subtotal, gst_percent, gst_amount, discount,
                     extra_charges, total, status, due_date, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,0,0,?,'auto_generated',?,NOW(),NOW())
            ");
            $stmt->execute([$invNumber, $partnerId, $periodStart, $periodEnd,
                $paymentAccountId, $subtotal, $gstPct, $gstAmt, $total, $dueDate]);
            $invId = (int)$db->lastInsertId();

            self::insertItems($db, $invId, $items);
            $generated[] = $invId;
        }

        jsonResponse([
            'message'   => 'Auto-generation complete',
            'generated' => count($generated),
            'skipped'   => count($skipped),
            'invoiceIds'=> $generated,
            'period'    => "$periodStart to $periodEnd",
        ]);
    }

    // PATCH /api/admin/partner-invoices/:id/review — modify items/pricing
    public static function review($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();

        $row = self::fetchRow($db, $id);
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        if (!in_array($row['status'], ['auto_generated','pending_review'])) {
            jsonResponse(['error' => 'Invoice is not in a reviewable state'], 422);
        }

        // Update meta fields
        $fields = []; $params = [];
        foreach ([
            'gstPercent'       => 'gst_percent',
            'discount'         => 'discount',
            'extraCharges'     => 'extra_charges',
            'extraChargesNote' => 'extra_charges_note',
            'adminNotes'       => 'admin_notes',
            'dueDate'          => 'due_date',
            'paymentAccountId' => 'payment_account_id',
        ] as $jsKey => $dbCol) {
            if (array_key_exists($jsKey, $data)) { $fields[] = "$dbCol = ?"; $params[] = $data[$jsKey]; }
        }
        $fields[] = "status = 'pending_review'";
        $fields[] = "reviewed_by = ?"; $params[] = $user['id'];
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        $db->prepare("UPDATE partner_invoices SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

        // Replace items if provided
        if (!empty($data['items'])) {
            $db->prepare("DELETE FROM partner_invoice_items WHERE invoice_id = ?")->execute([$id]);
            self::insertItems($db, $id, $data['items']);
        }

        // Recalculate totals
        self::recalcTotals($db, $id);

        jsonResponse(['invoice' => self::format(self::fetchRow($db, $id), $db, true)]);
    }

    // POST /api/admin/partner-invoices/:id/finalize
    public static function finalize($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $row  = self::fetchRow($db, $id);
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        if (in_array($row['status'], ['sent','paid','cancelled'])) jsonResponse(['error' => "Cannot finalize invoice with status: {$row['status']}"], 422);

        $data = getJsonInput();
        // Allow last-minute adjustments on finalize
        if (isset($data['paymentAccountId'])) {
            $db->prepare("UPDATE partner_invoices SET payment_account_id = ? WHERE id = ?")->execute([$data['paymentAccountId'], $id]);
        }
        if (!empty($data['items'])) {
            $db->prepare("DELETE FROM partner_invoice_items WHERE invoice_id = ?")->execute([$id]);
            self::insertItems($db, $id, $data['items']);
        }
        self::recalcTotals($db, $id);

        $db->prepare("UPDATE partner_invoices SET status = 'finalized', reviewed_by = ?, updated_at = NOW() WHERE id = ?")
           ->execute([$user['id'], $id]);

        jsonResponse(['invoice' => self::format(self::fetchRow($db, $id), $db, true)]);
    }

    // POST /api/admin/partner-invoices/:id/send
    public static function send($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $row  = self::fetchRow($db, $id);
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        if ($row['status'] !== 'finalized') jsonResponse(['error' => 'Invoice must be finalized before sending'], 422);

        $formatted = self::format($row, $db, true);

        // Send email to partner
        $p = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $p->execute([$row['partner_id']]); $partner = $p->fetch();
        if ($partner && $partner['email']) {
            try {
                Mailer::sendPartnerInvoiceEmail(
                    $partner['email'], $partner['name'],
                    $formatted['invoiceNumber'], (float)$formatted['total'],
                    $formatted['dueDate'], $formatted['billingPeriodStart'],
                    $formatted['billingPeriodEnd'], $formatted['items']
                );
            } catch (\Throwable $e) {
                appLog('error', 'Partner invoice email failed', ['id' => $id, 'err' => $e->getMessage()]);
            }
        }

        $db->prepare("UPDATE partner_invoices SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = ?")
           ->execute([$id]);

        jsonResponse(['invoice' => self::format(self::fetchRow($db, $id), $db, true)]);
    }

    // POST /api/admin/partner-invoices/:id/record-payment
    public static function recordPayment($id) {
        $user = Auth::protect();
        Auth::authorize('admin');
        $db   = getDb();
        $data = getJsonInput();
        $row  = self::fetchRow($db, $id);
        if (!$row) jsonResponse(['error' => 'Not found'], 404);

        $amount    = (float)($data['amount']        ?? 0);
        $method    = trim($data['paymentMethod']    ?? 'bank_transfer');
        $reference = trim($data['reference']        ?? '');
        $payDate   = $data['paymentDate']           ?? date('Y-m-d');
        $notes     = $data['notes']                 ?? '';
        if ($amount <= 0) jsonResponse(['error' => 'amount must be positive'], 422);

        $db->prepare("
            INSERT INTO partner_invoice_payments
                (invoice_id, amount, payment_date, payment_method, reference, notes, recorded_by, created_at)
            VALUES (?,?,?,?,?,?,?,NOW())
        ")->execute([$id, $amount, $payDate, $method, $reference, $notes, $user['id']]);

        // Update invoice status
        $paidTotal = (float)$db->prepare("SELECT COALESCE(SUM(amount),0) FROM partner_invoice_payments WHERE invoice_id = ?")
                                ->execute([$id]) ? $db->prepare("SELECT COALESCE(SUM(amount),0) FROM partner_invoice_payments WHERE invoice_id = ?")->execute([$id]) && false : 0;
        // Re-query properly
        $ps = $db->prepare("SELECT COALESCE(SUM(amount),0) AS total_paid FROM partner_invoice_payments WHERE invoice_id = ?");
        $ps->execute([$id]); $totalPaid = (float)$ps->fetchColumn();

        $invoiceTotal = (float)$row['total'];
        if ($totalPaid >= $invoiceTotal) {
            $db->prepare("UPDATE partner_invoices SET status = 'paid', paid_at = ?, payment_method = ?, payment_reference = ?, updated_at = NOW() WHERE id = ?")
               ->execute([$payDate, $method, $reference, $id]);
        } else {
            $db->prepare("UPDATE partner_invoices SET status = 'partial', payment_method = ?, payment_reference = ?, updated_at = NOW() WHERE id = ?")
               ->execute([$method, $reference, $id]);
        }

        // Notify partner of payment received
        $p = $db->prepare("SELECT name, email FROM users WHERE id = ?"); $p->execute([$row['partner_id']]); $partner = $p->fetch();
        if ($partner && $partner['email']) {
            try { Mailer::sendPartnerPaymentConfirmed($partner['email'], $partner['name'], $row['invoice_number'], $amount, $totalPaid, $invoiceTotal); }
            catch (\Throwable $e) {}
        }

        jsonResponse(['invoice' => self::format(self::fetchRow($db, $id), $db, true)]);
    }

    // PUT /api/admin/partner-invoices/:id/cancel
    public static function cancel($id) {
        Auth::protect(); Auth::authorize('admin');
        $db = getDb();
        $db->prepare("UPDATE partner_invoices SET status = 'cancelled', updated_at = NOW() WHERE id = ?")->execute([$id]);
        jsonResponse(['success' => true]);
    }

    // GET /api/partner-invoices/:id/pdf
    public static function generatePDF($id) {
        $user = Auth::protect();
        $db   = getDb();
        $row  = self::fetchRow($db, $id);
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        if ($user['role'] === 'partner' && (int)$row['partner_id'] !== $user['id']) jsonResponse(['error' => 'Forbidden'], 403);

        $formatted = self::format($row, $db, true);
        $html      = self::buildPDFHtml($formatted, $db);

        if (ob_get_level()) ob_clean();
        require_once __DIR__ . '/../../vendor/autoload.php';
        $opts = new \Dompdf\Options(); $opts->set('defaultFont','DejaVu Sans'); $opts->set('isRemoteEnabled', false);
        $dompdf = new \Dompdf\Dompdf($opts);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $formatted['invoiceNumber'] . '.pdf"');
        echo $dompdf->output();
        exit;
    }

    // GET /api/admin/partner-invoices/export/csv
    public static function exportCSV() {
        $user = Auth::protect(); Auth::authorize('admin');
        $db   = getDb();
        $period = $_GET['period'] ?? '';
        $params = []; $where = [];
        if ($period) { $where[] = "DATE_FORMAT(pi.billing_period_start,'%Y-%m') = ?"; $params[] = $period; }
        $whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql  = "SELECT pi.*, u.name AS partner_name, u.email AS partner_email
                 FROM partner_invoices pi LEFT JOIN users u ON u.id = pi.partner_id
                 $whereStr ORDER BY pi.created_at DESC";
        $stmt = $db->prepare($sql); $stmt->execute($params); $rows = $stmt->fetchAll();

        $filename = 'partner_invoices_' . date('Ymd') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['Invoice #','Partner','Email','Period Start','Period End','Subtotal','GST%','GST Amt','Discount','Extra','Total','Status','Due Date','Paid At']);
        foreach ($rows as $r) {
            fputcsv($out, [
                $r['invoice_number'], $r['partner_name'], $r['partner_email'],
                $r['billing_period_start'], $r['billing_period_end'],
                $r['subtotal'], $r['gst_percent'], $r['gst_amount'],
                $r['discount'], $r['extra_charges'], $r['total'],
                $r['status'], $r['due_date'] ?? '', $r['paid_at'] ?? '',
            ]);
        }
        fclose($out); exit;
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private static function fetchRow($db, $id) {
        $s = $db->prepare("SELECT * FROM partner_invoices WHERE id = ?"); $s->execute([$id]); return $s->fetch();
    }

    private static function generateInvoiceNumber($db, $prefix = 'PINV') {
        $year  = date('Y');
        $count = (int)$db->query("SELECT COUNT(*) FROM partner_invoices")->fetchColumn();
        return "$prefix-$year-" . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    }

    private static function calcSubtotal(array $items): float {
        return array_sum(array_map(fn($i) => (float)($i['amount'] ?? (($i['quantity'] ?? 1) * ($i['rate'] ?? 0))), $items));
    }

    private static function insertItems($db, $invId, array $items) {
        $ins = $db->prepare("
            INSERT INTO partner_invoice_items
                (invoice_id, service_request_id, service_id, description, quantity, rate, amount, item_type, sort_order)
            VALUES (?,?,?,?,?,?,?,?,?)
        ");
        foreach ($items as $idx => $item) {
            $qty  = (int)($item['quantity'] ?? 1);
            $rate = (float)($item['rate'] ?? 0);
            $amt  = isset($item['amount']) ? (float)$item['amount'] : $qty * $rate;
            $ins->execute([
                $invId,
                $item['serviceRequestId'] ?? null,
                $item['serviceId']        ?? null,
                $item['description']      ?? 'Service',
                $qty, $rate, $amt,
                $item['itemType']         ?? 'service',
                $idx,
            ]);
        }
    }

    private static function recalcTotals($db, $id) {
        $row  = self::fetchRow($db, $id);
        $subs = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM partner_invoice_items WHERE invoice_id = ? AND item_type NOT IN ('deduction')");
        $subs->execute([$id]); $subtotal = (float)$subs->fetchColumn();
        $dedu = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM partner_invoice_items WHERE invoice_id = ? AND item_type = 'deduction'");
        $dedu->execute([$id]); $deductions = (float)$dedu->fetchColumn();

        $gstPct  = (float)$row['gst_percent'];
        $gstAmt  = round($subtotal * $gstPct / 100, 2);
        $disc    = (float)$row['discount'];
        $extra   = (float)$row['extra_charges'];
        $total   = round($subtotal - $deductions + $gstAmt - $disc + $extra, 2);

        $db->prepare("UPDATE partner_invoices SET subtotal = ?, gst_amount = ?, total = ?, updated_at = NOW() WHERE id = ?")
           ->execute([$subtotal, $gstAmt, $total, $id]);
    }

    public static function format($row, $db, bool $withItems = false): array {
        if (!$row) return [];
        $id = (int)$row['id'];

        // Partner info
        $p = $db->prepare("SELECT id, name, email, phone FROM users WHERE id = ?"); $p->execute([$row['partner_id']]); $partnerData = $p->fetch();
        $partner = $partnerData ? ['id' => (int)$partnerData['id'], 'name' => $partnerData['name'], 'email' => $partnerData['email'], 'phone' => $partnerData['phone'] ?? ''] : null;

        // Payment account
        $payAccount = null;
        if ($row['payment_account_id']) {
            $pa = $db->prepare("SELECT * FROM payment_accounts WHERE id = ?"); $pa->execute([$row['payment_account_id']]);
            $paRow = $pa->fetch();
            if ($paRow) $payAccount = PaymentAccountController::format($paRow);
        }

        // Items
        $items = [];
        if ($withItems) {
            $is = $db->prepare("SELECT * FROM partner_invoice_items WHERE invoice_id = ? ORDER BY sort_order, id"); $is->execute([$id]);
            $items = array_map(fn($i) => [
                'id'               => (int)$i['id'],
                'serviceRequestId' => $i['service_request_id'] ? (int)$i['service_request_id'] : null,
                'serviceId'        => $i['service_id'] ? (int)$i['service_id'] : null,
                'description'      => $i['description'],
                'quantity'         => (int)$i['quantity'],
                'rate'             => (float)$i['rate'],
                'amount'           => (float)$i['amount'],
                'itemType'         => $i['item_type'],
            ], $is->fetchAll());
        }

        // Payment history
        $payments = [];
        if ($withItems) {
            $ps = $db->prepare("SELECT pip.*, u.name AS recorded_by_name FROM partner_invoice_payments pip LEFT JOIN users u ON u.id = pip.recorded_by WHERE pip.invoice_id = ? ORDER BY pip.created_at DESC");
            $ps->execute([$id]);
            $payments = array_map(fn($p) => [
                'id'             => (int)$p['id'],
                'amount'         => (float)$p['amount'],
                'paymentDate'    => $p['payment_date'],
                'paymentMethod'  => $p['payment_method'],
                'reference'      => $p['reference'] ?? '',
                'notes'          => $p['notes'] ?? '',
                'recordedBy'     => $p['recorded_by_name'] ?? '',
                'createdAt'      => $p['created_at'],
            ], $ps->fetchAll());
        }

        // Paid total
        $ptStmt = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM partner_invoice_payments WHERE invoice_id = ?");
        $ptStmt->execute([$id]); $paidTotal = (float)$ptStmt->fetchColumn();

        return [
            'id'                 => $id,
            'invoiceNumber'      => $row['invoice_number'],
            'partner'            => $partner,
            'partnerId'          => (int)$row['partner_id'],
            'billingPeriodStart' => $row['billing_period_start'],
            'billingPeriodEnd'   => $row['billing_period_end'],
            'paymentAccount'     => $payAccount,
            'paymentAccountId'   => $row['payment_account_id'] ? (int)$row['payment_account_id'] : null,
            'subtotal'           => (float)$row['subtotal'],
            'gstPercent'         => (float)$row['gst_percent'],
            'gstAmount'          => (float)$row['gst_amount'],
            'discount'           => (float)$row['discount'],
            'extraCharges'       => (float)$row['extra_charges'],
            'extraChargesNote'   => $row['extra_charges_note'] ?? '',
            'total'              => (float)$row['total'],
            'paidTotal'          => $paidTotal,
            'balanceDue'         => round((float)$row['total'] - $paidTotal, 2),
            'status'             => $row['status'],
            'adminNotes'         => $row['admin_notes'] ?? '',
            'dueDate'            => $row['due_date'],
            'sentAt'             => $row['sent_at'],
            'paidAt'             => $row['paid_at'],
            'paymentMethod'      => $row['payment_method'] ?? '',
            'paymentReference'   => $row['payment_reference'] ?? '',
            'createdAt'          => $row['created_at'],
            'updatedAt'          => $row['updated_at'],
            'items'              => $items,
            'paymentHistory'     => $payments,
        ];
    }

    private static function buildPDFHtml(array $inv, $db): string {
        $partner = $inv['partner'];
        $acc     = $inv['paymentAccount'];
        $items   = $inv['items'];
        $rs      = '₹';

        // Status colors
        $statusColor = match($inv['status']) {
            'paid'          => '#10b981',
            'overdue'       => '#ef4444',
            'cancelled'     => '#9ca3af',
            'sent'          => '#3b82f6',
            'finalized'     => '#8b5cf6',
            'auto_generated','pending_review' => '#f59e0b',
            default         => '#6b7280',
        };
        $statusLabel = strtoupper(str_replace('_',' ', $inv['status']));

        $itemsHtml = '';
        foreach ($items as $item) {
            $color = match($item['itemType']) {
                'deduction' => 'color:#ef4444',
                'extra'     => 'color:#f59e0b',
                'pending'   => 'color:#6b7280;font-style:italic',
                default     => '',
            };
            $prefix = $item['itemType'] === 'deduction' ? '-' : '';
            $itemsHtml .= '<tr>
                <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;' . $color . '">' . htmlspecialchars($item['description']) . '</td>
                <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;text-align:center;' . $color . '">' . $item['quantity'] . '</td>
                <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;text-align:right;' . $color . '">' . $rs . number_format($item['rate'],2) . '</td>
                <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;text-align:right;' . $color . '">' . $prefix . $rs . number_format(abs($item['amount']),2) . '</td>
            </tr>';
        }

        // Payment details section
        $paymentSection = '';
        if ($acc) {
            if ($acc['type'] === 'bank') {
                $paymentSection = '
                <div style="margin-top:32px;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981">
                  <p style="font-size:12px;font-weight:bold;color:#065f46;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Payment Details — Bank Transfer</p>
                  <table style="font-size:12px;color:#374151">
                    <tr><td style="padding:2px 20px 2px 0;color:#6b7280">Account Holder:</td><td><strong>' . htmlspecialchars($acc['accountHolder']) . '</strong></td></tr>
                    <tr><td style="padding:2px 20px 2px 0;color:#6b7280">Account Number:</td><td><strong>' . htmlspecialchars($acc['accountNumber']) . '</strong></td></tr>
                    <tr><td style="padding:2px 20px 2px 0;color:#6b7280">IFSC Code:</td><td><strong>' . htmlspecialchars($acc['ifscCode']) . '</strong></td></tr>
                    <tr><td style="padding:2px 20px 2px 0;color:#6b7280">Bank:</td><td>' . htmlspecialchars($acc['bankName']) . ($acc['branch'] ? ' — ' . htmlspecialchars($acc['branch']) : '') . '</td></tr>
                  </table>
                </div>';
            } else {
                $qrHtml = '';
                if ($acc['qrCodePath']) {
                    $absPath = __DIR__ . '/../../' . ltrim($acc['qrCodePath'], '/');
                    if (file_exists($absPath)) {
                        $ext   = strtolower(pathinfo($absPath, PATHINFO_EXTENSION));
                        $mime  = in_array($ext, ['jpg','jpeg']) ? 'image/jpeg' : 'image/png';
                        $b64   = base64_encode(file_get_contents($absPath));
                        $qrHtml = '<img src="data:' . $mime . ';base64,' . $b64 . '" style="width:140px;height:140px;margin-top:8px;display:block" />';
                    }
                }
                $paymentSection = '
                <div style="margin-top:32px;padding:16px;background:#eff6ff;border-radius:8px;border-left:4px solid #3b82f6">
                  <p style="font-size:12px;font-weight:bold;color:#1e40af;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Payment Details — UPI</p>
                  <p style="font-size:13px;color:#374151">UPI ID: <strong>' . htmlspecialchars($acc['upiId']) . '</strong></p>
                  ' . ($acc['label'] ? '<p style="font-size:12px;color:#6b7280">' . htmlspecialchars($acc['label']) . '</p>' : '') . '
                  ' . $qrHtml . '
                </div>';
            }
        }

        $discountRow = $inv['discount'] > 0 ? '<tr><td colspan="3" style="text-align:right;padding:5px 12px;color:#10b981;font-size:12px">Discount:</td><td style="text-align:right;padding:5px 12px;color:#10b981">-' . $rs . number_format($inv['discount'],2) . '</td></tr>' : '';
        $extraRow    = $inv['extraCharges'] > 0 ? '<tr><td colspan="3" style="text-align:right;padding:5px 12px;color:#f59e0b;font-size:12px">Extra Charges' . ($inv['extraChargesNote'] ? ' (' . htmlspecialchars($inv['extraChargesNote']) . ')' : '') . ':</td><td style="text-align:right;padding:5px 12px;color:#f59e0b">+' . $rs . number_format($inv['extraCharges'],2) . '</td></tr>' : '';

        return '<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"DejaVu Sans",Arial,sans-serif;color:#1f2937;font-size:13px}
  .page{max-width:820px;margin:0 auto;padding:44px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
  .brand{font-size:24px;font-weight:bold;color:#1a56db}
  .badge{background:' . $statusColor . ';color:#fff;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:bold}
  .period-badge{background:#f3f4f6;color:#6b7280;padding:3px 10px;border-radius:12px;font-size:11px;display:inline-block;margin-top:4px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f9fafb}
  th{padding:9px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e5e7eb}
  th:last-child,td:last-child{text-align:right}
  th:nth-child(2),td:nth-child(2){text-align:center}
  .tot{width:260px;margin-left:auto;margin-top:6px}
  .tot td{padding:5px 12px;font-size:12px}
  .grand td{font-size:15px;font-weight:bold;color:#1a56db;border-top:2px solid #1a56db;padding-top:8px}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:10px}
</style>
</head><body><div class="page">
  <div class="header">
    <div>
      <div class="brand">Tax CareerXera</div>
      <div style="font-size:11px;color:#6b7280;margin-top:3px">128/389 H-2 Block Kidwai Nagar, Kanpur — 208011<br>no-reply@tax.careerxera.com | +91 89249 54143</div>
    </div>
    <div style="text-align:right">
      <div class="badge">' . $statusLabel . '</div>
      <div style="font-size:18px;font-weight:bold;margin-top:8px;color:#1f2937">PARTNER INVOICE</div>
      <div style="font-size:13px;color:#6b7280">#' . htmlspecialchars($inv['invoiceNumber']) . '</div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:24px;gap:20px">
    <div>
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Payable To</div>
      <div style="font-weight:bold;font-size:14px;margin-top:3px">' . htmlspecialchars($partner['name'] ?? 'Partner') . '</div>
      <div style="font-size:12px;color:#6b7280">' . htmlspecialchars($partner['email'] ?? '') . '</div>
      ' . (!empty($partner['phone']) ? '<div style="font-size:12px;color:#6b7280">' . htmlspecialchars($partner['phone']) . '</div>' : '') . '
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Billing Period</div>
      <div style="font-weight:bold;font-size:13px;margin-top:3px">' . date('d M Y', strtotime($inv['billingPeriodStart'])) . ' — ' . date('d M Y', strtotime($inv['billingPeriodEnd'])) . '</div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px">Invoice Date: ' . date('d M Y', strtotime($inv['createdAt'])) . '</div>
      ' . ($inv['dueDate'] ? '<div style="font-size:12px;color:#6b7280">Due Date: <strong>' . date('d M Y', strtotime($inv['dueDate'])) . '</strong></div>' : '') . '
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>' . $itemsHtml . '</tbody>
  </table>

  <table class="tot">
    <tr><td colspan="3" style="text-align:right;color:#6b7280">Subtotal:</td><td style="text-align:right">' . $rs . number_format($inv['subtotal'],2) . '</td></tr>
    ' . ($inv['gstPercent'] > 0 ? '<tr><td colspan="3" style="text-align:right;color:#6b7280">GST (' . $inv['gstPercent'] . '%):</td><td style="text-align:right">' . $rs . number_format($inv['gstAmount'],2) . '</td></tr>' : '') . '
    ' . $discountRow . $extraRow . '
    <tr class="grand"><td colspan="3" style="text-align:right">Total Payable:</td><td style="text-align:right">' . $rs . number_format($inv['total'],2) . '</td></tr>
  </table>

  ' . $paymentSection . '

  ' . ($inv['adminNotes'] ? '<div style="margin-top:20px;padding:12px;background:#fffbeb;border-radius:6px;font-size:12px;color:#92400e"><strong>Notes: </strong>' . htmlspecialchars($inv['adminNotes']) . '</div>' : '') . '

  <div class="footer">This is a system-generated invoice from Tax CareerXera &nbsp;|&nbsp; tax.careerxera.com &nbsp;|&nbsp; ' . date('d M Y H:i') . '</div>
</div></body></html>';
    }
}
