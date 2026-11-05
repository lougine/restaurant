const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  tableNumber: { type: Number, min: 1 },
  guests: { type: Number, required: true, min: 1 },
}, { timestamps: true });

reservationSchema.index({ date: 1, timeSlot: 1, tableNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Reservation', reservationSchema);
