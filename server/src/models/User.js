const mongoose = require('mongoose');

if (process.env.VERCEL && !process.env.MONGODB_URI) {
  module.exports = require('../config/memoryModels').model('User');
} else {

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'kitchen', 'owner'], default: 'customer' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
}
