const app = require('./app');
const mongoose = require('mongoose');
const scheduleWorkshopStatusUpdates = require('./cron/workshopStatusUpdater');
const http = require('http');
const server = http.createServer(app); // Create server ONCE
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { setIo, connectedUsers } = require('./socket');
dotenv.config();
const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173']);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});
setIo(io);

io.on('connection', (socket) => {
  console.log('Socket.IO client connected:', socket.id);
  socket.on('register', (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`User registered: ${userId} -> ${socket.id}`);
    console.log('server.js: connectedUsers after registration:', connectedUsers);
  });
  socket.on('disconnect', () => {
    for (const [userId, id] of Object.entries(connectedUsers)) {
      if (id === socket.id) {
        delete connectedUsers[userId];
        console.log(`User disconnected: ${userId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bci_bms';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Initialize cron jobs
    scheduleWorkshopStatusUpdates();
    // Import cron jobs
    require('./cron/doerNotifications');
    require('./cron/eaPcNotifications');
    
    server.listen(PORT, () => { // Use the same server here
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
