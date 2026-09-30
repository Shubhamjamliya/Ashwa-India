module.exports = function registerSockets(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // booking status updates, ride-share matching, chat events go here

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};
