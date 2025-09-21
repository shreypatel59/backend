require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Mongo connected'))
  .catch(err => console.error(err));

// Map of userId -> socketId
const online = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Auth error'));
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = data.id;
    next();
  } catch (err) {
    next(new Error('Auth error'));
  }
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.userId);
  online.set(socket.userId, socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('private-message', async (payload) => {
    // payload: { to, text }
    const msg = await Message.create({ from: socket.userId, to: payload.to, text: payload.text });
    const toSocketId = online.get(payload.to);
    if (toSocketId) io.to(toSocketId).emit('private-message', { ...msg.toObject(), from: socket.userId });
    socket.emit('private-message', { ...msg.toObject(), from: socket.userId });
  });

  socket.on('disconnect', () => {
    online.delete(socket.userId);
    console.log('socket disconnected', socket.userId);
  });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find().select('_id name email avatarUrl');
  res.json(users);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server listening on', PORT));