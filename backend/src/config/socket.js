const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Online users map
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Join chat room
    socket.on('chat:join', (roomId) => {
      socket.join(roomId);
      console.log(`💬 Socket ${socket.id} joined room ${roomId}`);
    });

    // Send message
    socket.on('chat:message', (data) => {
      io.to(data.roomId).emit('chat:message', data);
    });

    // Typing indicator
    socket.on('chat:typing', (data) => {
      socket.to(data.roomId).emit('chat:typing', data);
    });

    // Notification
    socket.on('notification:send', (data) => {
      const targetSocketId = onlineUsers.get(data.userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notification:new', data);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
