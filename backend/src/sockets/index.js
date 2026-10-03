const jwt = require('jsonwebtoken');

module.exports = function registerSockets(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded.role === 'store-seller') {
          socket.join(`seller:${decoded.id}`);
        } else if (decoded.role === 'admin') {
          socket.join('admin');
        } else if (decoded.role === 'transporter') {
          socket.join(`transporter:${decoded.id}`);
        } else if (decoded.role === 'provider') {
          socket.join(`provider:${decoded.id}`);
        } else if (decoded.role === 'horse-seller') {
          socket.join(`horse-seller:${decoded.id}`);
        } else if (decoded.role === 'user') {
          socket.join(`user:${decoded.id}`);
        }
      } catch (err) {
        // invalid/expired token — socket just won't receive role-scoped events
      }
    }

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};
