const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

module.exports = function authMiddleware(req, res, next) {
    if (req.path === '/api/login') {
    return next(); // Skip auth for login route
  }
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  console.log("JWT token received:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
      console.log("Token decoded:", decoded);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type, // 'employee' or 'user'
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
