const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createOrder, verifyPayment, getPaymentHistory
} = require('../controllers/paymentController');

const router = express.Router();

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
