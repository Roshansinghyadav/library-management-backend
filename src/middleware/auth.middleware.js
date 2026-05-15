const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser.model');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminUser.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Not authorized. Account inactive or not found.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized. Invalid token.' });
  }
};

/**
 * Restrict to certain roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.admin.role}' is not permitted.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
