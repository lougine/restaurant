const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    timeSlot: { type: String, required: true }, // e.g. "19:00"
    tableNumber: { type: Number, required: true, min: 1, max: 8 },
    guests: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

reservationSchema.index({ date: 1, timeSlot: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Reservation', reservationSchema);  