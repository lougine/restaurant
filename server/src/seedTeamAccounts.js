require('dotenv').config();

const mongoose = require('mongoose');
const connectDatabase = require('./config/db');
const seedTeamAccounts = require('./config/seedTeamAccounts');

async function seed() {
  try {
    await connectDatabase();
    await seedTeamAccounts();
    console.log('Staff and owner accounts saved to MongoDB.');
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error(`Could not save team accounts: ${error.message}`);
  process.exitCode = 1;
});
