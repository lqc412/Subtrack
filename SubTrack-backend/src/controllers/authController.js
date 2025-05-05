// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authService from '../services/authServices.js';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await authService.createUser({ 
      username, 
      email, 
      password_hash: hashedPassword 
    });
    
    // Create default settings
    await authService.createUserSettings(newUser.id);
    
    // Generate and store token
    const token = generateToken(newUser.id);
    await authService.storeToken(newUser.id, token);
    
    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      },
      token
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate and store token
    const token = generateToken(user.id);
    await authService.storeToken(user.id, token);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await authService.deleteToken(token);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};