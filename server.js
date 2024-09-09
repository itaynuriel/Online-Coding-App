const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// MongoDB Connection Setup
mongoose.connect('mongodb://localhost:27017/codeblocks', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB successfully connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Mongoose Schema
const codeBlockSchema = new mongoose.Schema({
  code: String,
  solution: String
});
const CodeBlock = mongoose.model('CodeBlock', codeBlockSchema);

// Express App Setup
const app = express();
app.use(cors());

// Server and Socket.io Setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} trying to join room ${roomId}`);

    if (!rooms[roomId]) {
      // First user, set as mentor
      CodeBlock.findById(roomId).then(block => {
        rooms[roomId] = {
          code: block ? block.code : '// Default code',
          users: [socket.id],
          mentor: socket.id,
          solution: block ? block.solution : ''
        };
        console.log(`Room ${roomId} created, mentor assigned: ${socket.id}`);
        socket.emit('assign-role', { role: 'mentor', editable: false });
        io.to(roomId).emit('student-count', 1); // Including the mentor
        socket.emit('code-update', rooms[roomId].code);
      }).catch(err => {
        console.error(`Error fetching code block for room ${roomId}: ${err}`);
      });
    } else {
      // Subsequent users, set as students
      if (!rooms[roomId].users.includes(socket.id)) {
        rooms[roomId].users.push(socket.id);
        console.log(`Student ${socket.id} added to room ${roomId}`);
        socket.emit('assign-role', { role: 'student', editable: true });
      }
      io.to(roomId).emit('student-count', rooms[roomId].users.length);
      socket.emit('code-update', rooms[roomId].code);
    }
  });

  socket.on('code-update', ({ code, roomId }) => {
    if (rooms[roomId] && socket.id !== rooms[roomId].mentor) {
      rooms[roomId].code = code;
      socket.to(roomId).emit('code-update', code);
    }
  });

  socket.on('disconnect', () => {
    const roomId = Object.keys(rooms).find(id => rooms[id].users.includes(socket.id));
    if (roomId) {
      console.log(`Client ${socket.id} disconnected from room ${roomId}`);
      rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
      if (rooms[roomId].mentor === socket.id) {
        console.log(`Mentor ${socket.id} left, deleting room ${roomId}`);
        io.to(roomId).emit('mentor-left');
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('student-count', rooms[roomId].users.length);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
