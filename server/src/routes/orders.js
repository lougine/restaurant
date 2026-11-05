const express = require('express');
const mongoose = require('mongoose');
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

router.post('/', async (request, response, next) => {
  try {
    const { items, fulfillment = 'table', tableNumber, customerName, phone, address, total } = request.body;
    if (!['table', 'pickup', 'delivery'].includes(fulfillment)) return response.status(400).json({ message: 'Choose table, pickup, or delivery' });
    if (!Array.isArray(items) || items.length === 0 || items.length > 30 || !Number.isFinite(total) || total < 0) return response.status(400).json({ message: 'A valid order and total are required' });
    if (fulfillment === 'table' && (!Number.isInteger(Number(tableNumber)) || Number(tableNumber) < 1)) return response.status(400).json({ message: 'A valid table number is required' });
    if (fulfillment !== 'table' && !customerName?.trim()) return response.status(400).json({ message: 'Customer name is required' });
    if (fulfillment === 'delivery' && (!phone?.trim() || !address?.trim())) return response.status(400).json({ message: 'Phone and delivery location are required' });

    const orderItems = items.map((item) => {
      const menuItem = mongoose.Types.ObjectId.isValid(item.menuItem) ? item.menuItem : undefined;
      return { ...(menuItem ? { menuItem } : {}), name: item.name, price: Number(item.price), quantity: Number(item.quantity) };
    });
    if (orderItems.some((item) => !item.name?.trim() || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity < 1)) return response.status(400).json({ message: 'Order items are invalid' });

    const order = await Order.create({ items: orderItems, fulfillment, tableNumber: fulfillment === 'table' ? Number(tableNumber) : undefined, customerName, phone, address, total });
    request.app.get('io').to('team').emit('order:created', order);
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
    request.app.get('io').to('team').emit('order:updated', order);
    return response.json(order);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
