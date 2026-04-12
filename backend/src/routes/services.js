const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getServices, getServiceBySlug, createService, updateService, deleteService
} = require('../controllers/serviceController');

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/:slug', getServiceBySlug);

// Admin only
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;
