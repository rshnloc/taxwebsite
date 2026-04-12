const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminDashboard, getEmployeeDashboard, getClientDashboard, getReports
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/employee', authorize('employee'), getEmployeeDashboard);
router.get('/client', getClientDashboard);
router.get('/reports', authorize('admin'), getReports);

module.exports = router;
