const bcrypt = require('bcryptjs');
const User = require('../models/User');

const teamAccounts = [
  {
    name: 'Savor Staff',
    email: process.env.STAFF_LOGIN_EMAIL,
    password: process.env.STAFF_LOGIN_PASSWORD,
    role: 'kitchen',
  },
  {
    name: 'Savor Owner',
    email: process.env.OWNER_LOGIN_EMAIL,
    password: process.env.OWNER_LOGIN_PASSWORD,
    role: 'owner',
  },
];

async function seedTeamAccounts() {
  if (teamAccounts.some((account) => !account.email || !account.password)) {
    throw new Error('Set both team account emails and passwords before seeding MongoDB.');
  }

  for (const account of teamAccounts) {
    const password = await bcrypt.hash(account.password, 10);
    await User.findOneAndUpdate(
      { email: account.email.toLowerCase() },
      { $set: { name: account.name, email: account.email, password, role: account.role } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }
}

module.exports = seedTeamAccounts;
