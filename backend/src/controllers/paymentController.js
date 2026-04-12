const crypto = require('crypto');
const Application = require('../models/Application');

// @route   POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { applicationId, amount } = req.body;

    // In production, use actual Razorpay SDK:
    // const Razorpay = require('razorpay');
    // const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    // const order = await rzp.orders.create({ amount: amount * 100, currency: 'INR', receipt: applicationId });

    // Mock order for development
    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100,
      currency: 'INR',
      receipt: applicationId,
      status: 'created',
    };

    // Update application with order
    if (applicationId) {
      await Application.findByIdAndUpdate(applicationId, {
        'payment.amount': amount,
        'payment.razorpayOrderId': order.id,
      });
    }

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

    // In production, verify signature:
    // const body = razorpay_order_id + '|' + razorpay_payment_id;
    // const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    // if (expectedSignature !== razorpay_signature) return res.status(400).json({ error: 'Payment verification failed' });

    // Update application payment status
    if (applicationId) {
      await Application.findByIdAndUpdate(applicationId, {
        'payment.status': 'paid',
        'payment.razorpayPaymentId': razorpay_payment_id,
        'payment.paidAt': new Date(),
      });
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const query = req.user.role === 'client' ? { client: req.user._id } : {};
    const applications = await Application.find({
      ...query,
      'payment.status': { $in: ['paid', 'partial'] },
    })
      .populate('service', 'name')
      .populate('client', 'name email')
      .select('applicationId payment service client createdAt')
      .sort({ 'payment.paidAt': -1 });

    res.json({ payments: applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
