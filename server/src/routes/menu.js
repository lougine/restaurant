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

router.get('/admin', protect, authorize('owner'), async (request, response, next) => {
  try {
    return response.json(await MenuItem.find().sort({ category: 1, name: 1 }));
  } catch (error) {
    return next(error);
  }
});

router.post('/seed-defaults', protect, authorize('owner'), async (request, response, next) => {
  try {
    if (!Array.isArray(request.body.items)) return response.status(400).json({ message: 'Menu defaults are required' });
    const defaults = request.body.items.filter((item) => Number.isInteger(Number(item.id))).map((item) => ({
      sourceId: Number(item.id),
      name: item.name,
      price: Number(item.price),
      category: item.category,
      imageUrl: item.image || '',
      description: item.description || '',
      tag: item.tag || '',
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      isAvailable: true,
    }));
    await Promise.all(defaults.map(async (item) => {
      let existing = await MenuItem.findOne({ sourceId: item.sourceId });
      if (!existing) existing = await MenuItem.findOne({ name: item.name });
      if (existing) {
        if (existing.sourceId == null) {
          existing.sourceId = item.sourceId;
          await existing.save();
        }
        return;
      }
      await MenuItem.create(item);
    }));
    return response.json(await MenuItem.find().sort({ category: 1, name: 1 }));
  } catch (error) {
    return next(error);
  }
});

router.post('/', protect, authorize('owner'), async (request, response, next) => {
  try {
    const { name, price, category, imageUrl, description, tag, ingredients, allergens } = request.body;
    const item = await MenuItem.create({ name, price, category, imageUrl, description, tag, ingredients, allergens });
    return response.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', protect, authorize('owner'), async (request, response, next) => {
  try {
    const { name, price, category, imageUrl, description, tag, ingredients, allergens, isAvailable } = request.body;
    const item = await MenuItem.findByIdAndUpdate(request.params.id, { name, price, category, imageUrl, description, tag, ingredients, allergens, isAvailable }, { new: true, runValidators: true });
    if (!item) return response.status(404).json({ message: 'Menu item not found' });
    return response.json(item);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', protect, authorize('owner'), async (request, response, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(request.params.id, { isAvailable: false }, { new: true });
    if (!item) return response.status(404).json({ message: 'Menu item not found' });
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
