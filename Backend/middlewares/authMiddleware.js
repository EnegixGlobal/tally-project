const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function authMiddleware(req, res, next) {
  // Public routes
  const publicPaths = [
    '/api/login',
    '/api/admin/login',
    '/api/SignUp'
  ];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type, // keeping type for backward compatibility
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
