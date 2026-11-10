const mongoose = require('mongoose');

if (process.env.VERCEL && !process.env.MONGODB_URI) {
  module.exports = require('../config/memoryModels').model('MenuItem');
} else {

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' },
  description: { type: String, default: '' },
  tag: { type: String, default: '' },
  ingredients: { type: [String], default: [] },
  allergens: { type: [String], default: [] },
  sourceId: { type: Number, unique: true, sparse: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
}
