require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const registerSockets = require('./sockets');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
registerSockets(io);

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
