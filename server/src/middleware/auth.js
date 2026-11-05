const jwt = require('jsonwebtoken');

function protect(request, response, next) {
  const header = request.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return response.status(401).json({ message: 'Authentication required' });

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ message: 'You do not have permission to do this' });
    }
    return next();
  };
}

module.exports = { protect, authorize };
