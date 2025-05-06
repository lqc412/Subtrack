import jwt from 'jsonwebtoken';
import { query } from '../db.js';

/**
 * Middleware to authenticate JWT token from Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Verify token exists and is not expired in the database
    const { rows } = await query(
      'SELECT * FROM auth_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user info to request object
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
