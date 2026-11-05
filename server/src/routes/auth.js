const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (request, response, next) => {
  try {
    const { name, email, password } = request.body;
    if (!name || !email || !password) return response.status(400).json({ message: 'Name, email, and password are required' });
    if (password.length < 6) return response.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email });
    if (exists) return response.status(409).json({ message: 'Email is already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: 'customer' });
    return response.status(201).json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password))) return response.status(401).json({ message: 'Invalid email or password' });
    return response.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
