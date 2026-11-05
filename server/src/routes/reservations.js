const express = require('express');
const Reservation = require('../../models/Reservation');

const router = express.Router();

const SLOTS = ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00'];

// GET /api/reservations?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const filter = req.query.date ? { date: req.query.date } : {};
  const reservations = await Reservation.find(filter).sort({ timeSlot: 1 });
  res.json(reservations);
});

// POST /api/reservations
router.post('/', async (req, res) => {
  const { name, date, timeSlot, tableNumber, guests, note } = req.body;

  if (!name || !date || !timeSlot || !tableNumber || !guests) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!SLOTS.includes(timeSlot)) {
    return res.status(400).json({ message: 'Invalid time slot' });
  }

  const taken = await Reservation.findOne({ date, timeSlot, tableNumber });
  if (taken) {
    return res.status(409).json({ message: 'That table is already booked for this slot' });
  }

  try {
    const reservation = await Reservation.create({ name, date, timeSlot, tableNumber, guests, note });
    res.status(201).json(reservation);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That table is already booked for this slot' });
    }
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;