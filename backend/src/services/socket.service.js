import { Server } from 'socket.io';

let io;

export const initializeSocket = (server, options = {}) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8081'
      ],
      methods: ['GET', 'POST']
    },
    ...options
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected [id=${socket.id}]`);
    socket.on('joinSession', (sessionId) => {
      const room = `session_${sessionId}`;
      socket.join(room);
      console.log(`🛋️  Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected [id=${socket.id}]`);
    });
    // Allow clients to join personal user room for direct messages
    socket.on('joinUser', (userId) => {
      const userRoom = `user_${userId}`;
      socket.join(userRoom);
      console.log(`👤 Socket ${socket.id} joined user room ${userRoom}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
