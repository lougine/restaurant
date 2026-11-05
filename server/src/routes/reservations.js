const express = require('express');
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const SLOTS = ['5:30 pm', '6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:15 pm'];

router.get('/availability', async (req, res, next) => {
  try {
    if (!req.query.date) return res.status(400).json({ message: 'A date is required' });
    const reservations = await Reservation.find({ date: req.query.date }).select('timeSlot tableNumber -_id').lean();
    return res.json(reservations);
  } catch (error) {
    return next(error);
  }
});

router.get('/', protect, authorize('kitchen', 'owner'), async (req, res, next) => {
  try {
  const filter = req.query.date ? { date: req.query.date } : {};
  const reservations = await Reservation.find(filter).sort({ timeSlot: 1 });
  return res.json(reservations);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res) => {
  const { name, phone, date, timeSlot, tableNumber, guests } = req.body;

  if (!name || !date || !timeSlot || !tableNumber || !guests) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 20) return res.status(400).json({ message: 'Guest count is invalid' });
  if (!SLOTS.includes(timeSlot)) {
    return res.status(400).json({ message: 'Invalid time slot' });
  }

  const taken = await Reservation.findOne({ date, timeSlot, tableNumber });
  if (taken) {
    return res.status(409).json({ message: 'That table is already booked for this slot' });
  }

  try {
    const reservation = await Reservation.create({ name, phone, date, timeSlot, tableNumber: Number(tableNumber), guests: Number(guests) });
    req.app.get('io').to('team').emit('reservation:created', reservation);
    res.status(201).json(reservation);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That table is already booked for this slot' });
    }
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
