require('dotenv').config();

const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDatabase = require('./config/db');
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in server/.env');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });

app.set('io', io);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (request, response) => response.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use(express.json());
app.use('/api/reservations', require('./routes/reservations'));

app.use((error, request, response, next) => {
  console.error(error);
  if (error.name === 'ValidationError') return response.status(400).json({ message: error.message });
  return response.status(500).json({ message: 'Internal server error' });
});

const port = process.env.PORT || 4000;

async function start() {
  await connectDatabase();
  httpServer.listen(port, () => console.log(`API running at http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { app, httpServer };
