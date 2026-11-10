const mongoose = require('mongoose');

let memoryServer;

async function connectDatabase() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: { args: ['--wiredTigerCacheSizeGB', '0.25'] },
    });
    uri = memoryServer.getUri('savor');
    console.log('MONGODB_URI not set: using a built-in in-memory database (demo mode)');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
  return { demo: Boolean(memoryServer) };
}

module.exports = connectDatabase;
