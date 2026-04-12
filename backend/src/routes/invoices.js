const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getInvoices, getInvoiceById, createInvoice, updateInvoice, generatePDF, getMyInvoices
} = require('../controllers/invoiceController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getInvoices);
router.get('/my', getMyInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', generatePDF);
router.post('/', authorize('admin'), createInvoice);
router.put('/:id', authorize('admin'), updateInvoice);

module.exports = router;
