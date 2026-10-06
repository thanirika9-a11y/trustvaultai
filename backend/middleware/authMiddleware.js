const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Missing token.',
      code: 'AUTH_MISSING_TOKEN',
      details: []
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret123');

    // Attach user to request (with database-offline fallback)
    const isDbConnected = require('mongoose').connection.readyState === 1;
    if (!isDbConnected) {
      req.user = {
        _id: decoded.userId || 'demo_001',
        id: decoded.userId || 'demo_001',
        name: 'Arun Kumar',
        email: 'arun.kumar@trustvault.com',
        role: 'user'
      };
    } else {
      req.user = await User.findById(decoded.userId);
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.',
          code: 'AUTH_USER_NOT_FOUND',
          details: []
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid or expired token.',
      code: 'AUTH_INVALID_TOKEN',
      details: []
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        code: 'AUTH_FORBIDDEN',
        details: []
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
