<?php
class PaymentController {

    // POST /api/payments/create-order
    public static function createOrder() {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();
        $applicationId = $data['applicationId'] ?? null;
        $amount = (float)($data['amount'] ?? 0);

        // Mock order (use Razorpay SDK in production)
        $orderId = 'order_' . time() . '_' . bin2hex(random_bytes(5));
        $order = [
            'id' => $orderId,
            'amount' => $amount * 100,
            'currency' => 'INR',
            'receipt' => $applicationId,
            'status' => 'created',
        ];

        if ($applicationId) {
            $db->prepare("UPDATE applications SET payment_amount = ?, payment_razorpay_order_id = ? WHERE id = ?")
               ->execute([$amount, $orderId, $applicationId]);
        }

        $config = require __DIR__ . '/../../config.php';
        jsonResponse(['order' => $order, 'key' => $config['RAZORPAY_KEY_ID'] ?? '']);
    }

    // POST /api/payments/verify
    public static function verifyPayment() {
        Auth::protect();
        $data = getJsonInput();
        $db = getDb();
        $applicationId = $data['applicationId'] ?? null;
        $paymentId = $data['razorpay_payment_id'] ?? '';

        if ($applicationId) {
            $db->prepare("UPDATE applications SET payment_status = 'paid', payment_razorpay_payment_id = ?, payment_paid_at = NOW() WHERE id = ?")
               ->execute([$paymentId, $applicationId]);
        }

        jsonResponse(['success' => true, 'message' => 'Payment verified successfully']);
    }

    // GET /api/payments/history
    public static function getPaymentHistory() {
        Auth::protect();
        $db = getDb();

        $where = "payment_status IN ('paid','partial')";
        $params = [];
        if (Auth::user()['role'] === 'client') {
            $where .= " AND client_id = ?";
            $params[] = Auth::userId();
        }

        $stmt = $db->prepare("SELECT a.id, a.application_id, a.payment_amount, a.payment_gst, a.payment_total, a.payment_status, a.payment_paid_at, a.created_at, s.name as service_name, u.name as client_name, u.email as client_email FROM applications a LEFT JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.client_id = u.id WHERE $where ORDER BY a.payment_paid_at DESC");
        $stmt->execute($params);

        $payments = array_map(fn($p) => [
            '_id' => (string)$p['id'],
            'applicationId' => $p['application_id'],
            'payment' => [
                'amount' => (float)$p['payment_amount'], 'gst' => (float)$p['payment_gst'],
                'total' => (float)$p['payment_total'], 'status' => $p['payment_status'],
                'paidAt' => $p['payment_paid_at'],
            ],
            'service' => ['name' => $p['service_name']],
            'client' => ['name' => $p['client_name'], 'email' => $p['client_email']],
            'createdAt' => $p['created_at'],
        ], $stmt->fetchAll());

        jsonResponse(['payments' => $payments]);
    }
}
