const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { upload, setUploadDir } = require('../middleware/upload');
const {
  getApplications, getApplicationById, createApplication, updateApplication,
  updateApplicationStatus, assignEmployee, uploadDocuments, getMyApplications
} = require('../controllers/applicationController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'employee'), getApplications);
router.get('/my', getMyApplications);
router.get('/:id', getApplicationById);
router.post('/', setUploadDir('applications'), upload.array('documents', 10), createApplication);
router.put('/:id', authorize('admin', 'employee'), updateApplication);
router.put('/:id/status', authorize('admin', 'employee'), updateApplicationStatus);
router.put('/:id/assign', authorize('admin'), assignEmployee);
router.post('/:id/documents', setUploadDir('applications'), upload.array('documents', 10), uploadDocuments);

module.exports = router;
