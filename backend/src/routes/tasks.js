const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getTasks, getTaskById, createTask, updateTask, updateTaskStatus, getMyTasks
} = require('../controllers/taskController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getTasks);
router.get('/my', authorize('employee'), getMyTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('admin'), createTask);
router.put('/:id', authorize('admin', 'employee'), updateTask);
router.put('/:id/status', authorize('admin', 'employee'), updateTaskStatus);

module.exports = router;
