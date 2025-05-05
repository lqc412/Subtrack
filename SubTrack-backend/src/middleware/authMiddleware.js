// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token exists in database
    const { rows } = await query('SELECT * FROM auth_tokens WHERE token = $1 AND expires_at > NOW()', [token]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Add user to request
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};