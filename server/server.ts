import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://collabo-five.vercel.app", // Явно указываем разрешенный origin
    methods: ["GET", "POST"]
  },
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', data);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });

  socket.on('undo', (data) => {
    socket.broadcast.emit('undo', data);
  });

  socket.on('redo', (data) => {
    socket.broadcast.emit('redo', data);
  });

  socket.on('selectImage', (data) => {
    socket.broadcast.emit('imageSelected', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});