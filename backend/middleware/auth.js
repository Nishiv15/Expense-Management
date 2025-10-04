import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // Get token from the header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Add user from payload to the request object
    req.user = decoded;
    next(); // Move to the next piece of middleware or the route handler
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

export default authMiddleware;