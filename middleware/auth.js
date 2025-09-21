const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

module.exports = async function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(data.id).select('-passwordHash');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};