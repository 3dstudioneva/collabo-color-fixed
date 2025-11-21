import { Server } from 'socket.io';
import type { Handler } from '@netlify/functions';

const io = new Server();

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

const handler: Handler = async (event, context) => {
  // @ts-ignore
  io.listen(3001);
  return {
    statusCode: 200,
  };
};

export { handler };