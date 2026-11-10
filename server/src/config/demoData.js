const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');

const DEMO_ACCOUNTS = [
  { name: 'Savor Staff', email: 'staff@savor.restaurant.eg', password: 'savor2026', role: 'kitchen' },
  { name: 'Savor Owner', email: 'owner@savor.restaurant.eg', password: 'savor2026', role: 'owner' },
];

async function ensureDemoAccounts() {
  const teamCount = await User.countDocuments({ role: { $in: ['kitchen', 'owner'] } });
  if (teamCount > 0) return;

  for (const account of DEMO_ACCOUNTS) {
    await User.create({ ...account, password: await bcrypt.hash(account.password, 10) });
  }
  console.log('Created demo staff and owner accounts');
}

const MENU = [
  ['Charred octopus', 400], ['Garden mezze', 350], ['Lamb shoulder', 320], ['Fire-roasted flatbread', 210],
  ['Citrus salmon', 280], ['Olive oil cake', 250], ['Blueberry mojito', 150], ['Passion mojito', 150],
];

async function seedDemoOrders() {
  if (await Order.estimatedDocumentCount() > 0) return;

  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pick = (list) => list[Math.floor(random() * list.length)];
  const now = Date.now();
  const orders = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const count = 6 + Math.floor(random() * 6);
    for (let n = 0; n < count; n += 1) {
      const items = [];
      const lines = 1 + Math.floor(random() * 3);
      for (let i = 0; i < lines; i += 1) {
        const [name, price] = pick(MENU);
        if (!items.some((item) => item.name === name)) items.push({ name, price, quantity: 1 + Math.floor(random() * 2) });
      }
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const fulfillment = pick(['table', 'table', 'table', 'pickup', 'delivery']);
      const minutesAgo = daysAgo * 24 * 60 + 30 + Math.floor(random() * 9 * 60);
      const createdAt = new Date(now - minutesAgo * 60 * 1000);
      orders.push({
        items,
        fulfillment,
        tableNumber: fulfillment === 'table' ? 1 + Math.floor(random() * 12) : undefined,
        customerName: fulfillment === 'table' ? undefined : pick(['Mona', 'Karim', 'Salma', 'Omar', 'Nour']),
        phone: fulfillment === 'delivery' ? '01000000000' : undefined,
        address: fulfillment === 'delivery' ? '26th of July St, Zamalek' : undefined,
        status: 'served',
        total: Number((subtotal * 1.1).toFixed(2)),
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  ['pending', 'pending', 'preparing', 'ready'].forEach((status, index) => {
    const [name, price] = MENU[index * 2];
    const createdAt = new Date(now - (4 + index * 6) * 60 * 1000);
    orders.push({
      items: [{ name, price, quantity: 1 }, { name: 'Blueberry mojito', price: 150, quantity: 2 }],
      fulfillment: 'table',
      tableNumber: 3 + index,
      status,
      total: Number(((price + 300) * 1.1).toFixed(2)),
      createdAt,
      updatedAt: createdAt,
    });
  });

  await Order.insertMany(orders, { timestamps: false });
  console.log(`Added ${orders.length} sample orders (demo mode)`);
}

module.exports = { ensureDemoAccounts, seedDemoOrders };
