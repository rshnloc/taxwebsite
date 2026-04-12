const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers, getUserById, createUser, updateUser, deleteUser, getEmployees
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/employees', authorize('admin'), getEmployees);
router.get('/:id', authorize('admin', 'employee'), getUserById);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
