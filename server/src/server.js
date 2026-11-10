require('dotenv').config();

const cors = require('cors');
const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDatabase = require('./config/db');
const { ensureDemoAccounts, seedDemoOrders } = require('./config/demoData');
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in server/.env');

const app = express();
const httpServer = http.createServer(app);
const clientOrigins = [...new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
])];
const io = new Server(httpServer, { cors: { origin: clientOrigins } });
let databaseReady;

async function ensureDatabase() {
  if (!databaseReady) {
    databaseReady = connectDatabase().then(async ({ demo }) => {
      await ensureDemoAccounts();
      if (demo) await seedDemoOrders();
    });
  }
  return databaseReady;
}

io.use(async (socket, next) => {
  try {
    if (process.env.VERCEL) await ensureDatabase();
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!['kitchen', 'owner'].includes(user.role)) return next(new Error('Staff access required'));
    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error(error.name === 'JsonWebTokenError' ? 'Invalid or expired token' : 'Service initialization failed'));
  }
});
io.on('connection', (socket) => socket.join('team'));

app.set('io', io);
app.use(cors({ origin: clientOrigins }));
app.use(express.json({ limit: '5mb' }));

if (process.env.VERCEL) {
  app.use(async (request, response, next) => {
    if (!request.path.startsWith('/api/')) return next();
    try {
      await ensureDatabase();
      return next();
    } catch (error) {
      console.error(error);
      return response.status(503).json({ message: 'Service initialization failed' });
    }
  });
}

app.get('/api/health', (request, response) => response.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api', (request, response) => response.status(404).json({ message: 'Not found' }));

const buildDir = path.join(__dirname, '..', '..', 'build');
if ((!process.env.VERCEL || !process.env.VERCEL_URL) && fs.existsSync(path.join(buildDir, 'index.html'))) {
  app.use(express.static(buildDir));
  app.use((request, response, next) => {
    if (request.method !== 'GET') return next();
    return response.sendFile(path.join(buildDir, 'index.html'));
  });
}

app.use((error, request, response, next) => {
  console.error(error);
  if (error.name === 'ValidationError') return response.status(400).json({ message: error.message });
  return response.status(500).json({ message: 'Internal server error' });
});

const port = process.env.PORT || 4000;

async function start() {
  await ensureDatabase();
  httpServer.listen(port, () => console.log(`API running at http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { app, httpServer };
