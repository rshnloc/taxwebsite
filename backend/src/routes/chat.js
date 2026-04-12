const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, setUploadDir } = require('../middleware/upload');
const {
  getChatRooms, getChatRoom, getMessages, sendMessage, createChatRoom
} = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.get('/rooms', getChatRooms);
router.get('/rooms/:id', getChatRoom);
router.get('/rooms/:id/messages', getMessages);
router.post('/rooms', createChatRoom);
router.post('/rooms/:id/messages', setUploadDir('chat'), upload.single('file'), sendMessage);

module.exports = router;
