import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as authService from '../services/authServices.js';
import * as userService from '../services/userServices.js';
import * as notificationService from '../services/notificationService.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user
    const newUser = await authService.createUser({
      username,
      email,
      password_hash: hashedPassword
    });

    // Create default user settings
    await authService.createUserSettings(newUser.id);

    // Generate and store token
    const token = generateToken(newUser.id);
    await authService.storeToken(newUser.id, token);

    // Attempt to send welcome email without blocking the response
    notificationService
      .sendWelcomeEmail(newUser)
      .catch((emailError) => console.warn('Failed to send welcome email:', emailError));

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

/**
 * Log in an existing user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
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

/**
 * Log out a user (invalidate token)
 */
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

/**
 * Verify if a token is valid and return user info
 */
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token not provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

      // Check if token is stored and valid
      const tokenExists = await authService.findToken(token);
      if (!tokenExists) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Fetch user data
      const user = await authService.findUserById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      return res.status(403).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error during token verification:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

/**
 * Start password reset flow by sending an email
 */
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await authService.findUserByEmail(email);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await authService.removePasswordResetTokensForUser(user.id);
      await authService.createPasswordResetToken(user.id, tokenHash, expiresAt);

      notificationService
        .sendPasswordResetEmail(user, rawToken)
        .catch((emailError) => console.warn('Failed to send password reset email:', emailError));
    }

    res.json({
      message: 'If an account exists for that email, password reset instructions have been sent.'
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Complete password reset using the provided token
 */
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await authService.findPasswordResetToken(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      await authService.markPasswordResetTokenUsed(resetRecord.id);
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    await userService.updatePassword(resetRecord.user_id, hashedPassword);
    await authService.markPasswordResetTokenUsed(resetRecord.id);
    await authService.deleteTokensByUserId(resetRecord.user_id);

    const user = await authService.findUserById(resetRecord.user_id);
    notificationService
      .sendPasswordChangedEmail(user)
      .catch((emailError) => console.warn('Failed to send password change confirmation:', emailError));

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
