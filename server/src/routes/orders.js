const express = require('express');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const statuses = ['pending', 'preparing', 'ready', 'served'];

router.get('/', protect, authorize('kitchen', 'owner'), async (request, response, next) => {
  try {
    return response.json(await Order.find().sort({ createdAt: -1 }));
  } catch (error) {
    return next(error);
  }
});

router.post('/', protect, authorize('customer'), async (request, response, next) => {
  try {
    const { items, tableNumber, total } = request.body;
    if (!Array.isArray(items) || items.length === 0 || !tableNumber || typeof total !== 'number') return response.status(400).json({ message: 'items, tableNumber, and total are required' });
    const order = await Order.create({ items, tableNumber, total });
    request.app.get('io').emit('order:created', order);
    return response.status(201).json(order);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/status', protect, authorize('kitchen', 'owner'), async (request, response, next) => {
  try {
    if (!statuses.includes(request.body.status)) return response.status(400).json({ message: 'Invalid order status' });
    const order = await Order.findByIdAndUpdate(request.params.id, { status: request.body.status }, { new: true, runValidators: true });
    if (!order) return response.status(404).json({ message: 'Order not found' });
    request.app.get('io').emit('order:updated', order);
    return response.json(order);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
