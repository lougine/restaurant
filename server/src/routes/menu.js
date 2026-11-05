const express = require('express');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (request, response, next) => {
  try {
    return response.json(await MenuItem.find().sort({ category: 1, name: 1 }));
  } catch (error) {
    return next(error);
  }
});

router.post('/', protect, authorize('owner'), async (request, response, next) => {
  try {
    const item = await MenuItem.create(request.body);
    return response.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', protect, authorize('owner'), async (request, response, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true });
    if (!item) return response.status(404).json({ message: 'Menu item not found' });
    return response.json(item);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', protect, authorize('owner'), async (request, response, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(request.params.id);
    if (!item) return response.status(404).json({ message: 'Menu item not found' });
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
