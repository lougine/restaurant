const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: { type: [orderItemSchema], required: true },
  fulfillment: { type: String, enum: ['table', 'pickup', 'delivery'], default: 'table', required: true },
  tableNumber: { type: Number, min: 1 },
  customerName: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  total: { type: Number, required: true, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
