import bcrypt from 'bcrypt';
import * as userService from '../services/userServices.js';
import * as authService from '../services/authServices.js';

/**
 * Get currently authenticated user's information
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    delete user.password_hash; // Never expose password hash
    res.json(user);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update profile for the authenticated user
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, profile_image } = req.body;

    // If email is changed, check for duplicates
    if (email) {
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email is already in use by another user' });
      }
    }

    const updatedUser = await userService.updateUser(userId, {
      username,
      email,
      profile_image
    });

    delete updatedUser.password_hash;
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get user preferences (or create default if not found)
 */
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await authService.getUserSettings(userId);

    if (!preferences) {
      const defaultPreferences = await authService.createUserSettings(userId);
      return res.json(defaultPreferences);
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme_preference, currency_preference, notification_preferences } = req.body;

    const updatedPreferences = await authService.updateUserSettings(userId, {
      theme_preference,
      currency_preference,
      notification_preferences
    });

    res.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Change user password (requires current password validation)
 * and invalidate all user tokens (force logout)
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.password_hash) {
      return res.status(400).json({ message: 'Password reset required. Please contact support.' });
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await userService.updatePassword(userId, hashedPassword);
    
    // Get the current token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Invalidate all user tokens (this will force logout on all devices)
    await authService.deleteToken(userId);

    res.json({ 
      message: 'Password updated successfully',
      logout: true // Signal to frontend that user should be logged out
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
