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
  title: String,
  code: String,
  problem: String,
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
    console.log(`Client ${socket.id} joined room ${roomId}`);

    // Assign roles and manage users
    if (!rooms[roomId]) {
      // First user becomes the mentor
      rooms[roomId] = {
        code: '// Write your code here\n',
        users: [],
        mentor: socket.id,
        studentCount: -1 // Initialize student count
      };
      socket.emit('assign-role', { role: 'mentor', editable: false });
      console.log(`Mentor assigned: ${socket.id} in room ${roomId}`);
    } else {
      // Subsequent users are students
      if (!rooms[roomId].users.includes(socket.id)) {
        rooms[roomId].users.push(socket.id);
        rooms[roomId].studentCount++;
        socket.emit('assign-role', { role: 'student', editable: true });
        console.log(`Student assigned: ${socket.id} in room ${roomId}`);
      }
    }

    // Broadcast the updated student count (+1 includes mentor)
    io.to(roomId).emit('student-count', rooms[roomId].studentCount +1 );

    socket.emit('code-update', rooms[roomId].code);
  });

  socket.on('code-update', ({ code, roomId }) => {
    if (rooms[roomId] && socket.id !== rooms[roomId].mentor) {
      rooms[roomId].code = code;
      socket.to(roomId).emit('code-update', code); // Ensure mentor sees updates
    }
  });

  socket.on('disconnect', () => {
    const roomId = Object.keys(rooms).find(id => rooms[id].mentor === socket.id || rooms[id].users.includes(socket.id));

    if (roomId) {
      if (rooms[roomId].mentor === socket.id) {
        // Mentor leaves, notify and reset room
        io.to(roomId).emit('mentor-left');
        console.log(`Mentor ${socket.id} left, closing room ${roomId}`);
        delete rooms[roomId];
      } else {
        // Student leaves, update student count
        rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
        rooms[roomId].studentCount--;
        io.to(roomId).emit('student-count', rooms[roomId].studentCount +1);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

