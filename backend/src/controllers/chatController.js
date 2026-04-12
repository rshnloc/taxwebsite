const { ChatRoom, Message } = require('../models/Chat');

// @route   GET /api/chat/rooms
const getChatRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id, isActive: true })
      .populate('participants', 'name email role avatar')
      .populate('application', 'applicationId')
      .sort({ updatedAt: -1 });
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/chat/rooms/:id
const getChatRoom = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id)
      .populate('participants', 'name email role avatar')
      .populate('application', 'applicationId');
    if (!room) return res.status(404).json({ error: 'Chat room not found' });
    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/chat/rooms/:id/messages
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'name role avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { room: req.params.id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/chat/rooms
const createChatRoom = async (req, res) => {
  try {
    const { applicationId, participantIds } = req.body;

    // Check for existing room
    let room = await ChatRoom.findOne({ application: applicationId });
    if (room) {
      const populated = await ChatRoom.findById(room._id)
        .populate('participants', 'name email role avatar')
        .populate('application', 'applicationId');
      return res.json({ room: populated });
    }

    room = await ChatRoom.create({
      application: applicationId,
      participants: [...participantIds, req.user._id],
    });

    const populated = await ChatRoom.findById(room._id)
      .populate('participants', 'name email role avatar')
      .populate('application', 'applicationId');

    res.status(201).json({ room: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/chat/rooms/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const messageData = {
      room: req.params.id,
      sender: req.user._id,
      content,
      type,
    };

    if (req.file) {
      messageData.type = 'file';
      messageData.fileUrl = `/uploads/chat/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.content = content || req.file.originalname;
    }

    const message = await Message.create(messageData);

    // Update last message in room
    await ChatRoom.findByIdAndUpdate(req.params.id, {
      lastMessage: {
        content: message.content,
        sender: req.user._id,
        timestamp: new Date(),
      },
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name role avatar');

    // Emit via socket
    try {
      const { getIO } = require('../config/socket');
      getIO().to(req.params.id).emit('chat:message', populated);
    } catch (e) { /* socket not ready */ }

    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getChatRooms, getChatRoom, getMessages, sendMessage, createChatRoom };
