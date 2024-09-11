const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');


// MongoDB Connection Setup
// mongoose.connect('mongodb://localhost:27017/codeblocks')
//   .then(() => console.log("MongoDB successfully connected"))
//   .catch(err => console.error("MongoDB connection error:", err));
 
  mongoose.connect('mongodb+srv://itaynuriel1:burhtk11@codeblocks.rdwbv.mongodb.net/codeblocks?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "codeblocks"
  })
  .then(() => console.log('MongoDB connected to Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));


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

app.get("/api/getCodeBlocks", async (req, res) => {
    try {
       const codeBlock = await CodeBlock.find({});
        res.send(codeBlock)
    } catch {
        res.status(500);
    }
})

app.get("/", async (req, res) => {
        res.send("hello from api")
})

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

  socket.on('join-room', async ({ roomId }) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);

       // Fetch the code block data from the database by roomId
  let codeBlock;
  try {
    codeBlock = await CodeBlock.findById(roomId);
    if (codeBlock) {
      console.log("Emitting solution: ", codeBlock.solution);  // Log the solution being emitted
      socket.emit('solution', codeBlock.solution);  // Send solution to client
    } else {
      console.log("No code block found for this roomId:", roomId);
    }
  } catch (error) {
    console.error("Error finding code block:", error);
  }

    // Initialize the room if it doesn't exist yet
    if (!rooms[roomId]) {
      // First user becomes the mentor
      rooms[roomId] = {
        code: codeBlock ? codeBlock.code : '// Write your code here\n',
        users: [],
        mentor: socket.id,
        studentCount: -1, // Initialize student count
        solution: codeBlock ? codeBlock.solution : '' // Store the solution
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
    io.to(roomId).emit('student-count', rooms[roomId].studentCount + 1);

    // Send the current code and solution to the client
    socket.emit('code-update', rooms[roomId].code);
    socket.emit('solution', rooms[roomId].solution); // Send solution to client
  });

  // Handle code updates
  socket.on('code-update', ({ code, roomId }) => {
    if (rooms[roomId] && socket.id !== rooms[roomId].mentor) {
      rooms[roomId].code = code;
      socket.to(roomId).emit('code-update', code); // Broadcast code changes to other students
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const roomId = Object.keys(rooms).find(id => rooms[id].mentor === socket.id || rooms[id].users.includes(socket.id));

    if (roomId) {
      if (rooms[roomId].mentor === socket.id) {
        // Mentor leaves, notify and reset the room
        io.to(roomId).emit('mentor-left');
        console.log(`Mentor ${socket.id} left, closing room ${roomId}`);
        delete rooms[roomId];
      } else {
        // Student leaves, update student count
        rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
        rooms[roomId].studentCount--;
        io.to(roomId).emit('student-count', rooms[roomId].studentCount + 1);
      }
    }
  });
});

// Listen to server on specified port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
