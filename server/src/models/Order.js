const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: { type: [orderItemSchema], required: true },
  tableNumber: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  total: { type: Number, required: true, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
