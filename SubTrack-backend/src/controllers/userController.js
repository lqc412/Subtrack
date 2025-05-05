// src/controllers/userController.js
import bcrypt from 'bcrypt';
import * as userService from '../services/userServices.js';
import * as authService from '../services/authServices.js';

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不返回密码哈希
    delete user.password_hash;
    
    res.json(user);
  } catch (error) {
    console.error('获取用户信息出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 更新用户个人资料
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, profile_image } = req.body;
    
    // 如果更改了邮箱，检查是否已被使用
    if (email) {
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: '该邮箱已被其他用户使用' });
      }
    }
    
    const updatedUser = await userService.updateUser(userId, { 
      username, 
      email, 
      profile_image 
    });
    
    // 不返回密码哈希
    delete updatedUser.password_hash;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('更新用户个人资料出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取用户偏好设置
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await authService.getUserSettings(userId);
    
    if (!preferences) {
      // 如果没有找到设置，创建默认设置
      const defaultPreferences = await authService.createUserSettings(userId);
      return res.json(defaultPreferences);
    }
    
    res.json(preferences);
  } catch (error) {
    console.error('获取用户设置出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 更新用户偏好设置
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
    console.error('更新用户设置出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 更改密码
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // 获取用户信息，包括密码哈希
    const user = await userService.getUserById(userId);
    
    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '当前密码不正确' });
    }
    
    // 哈希新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 更新密码
    await userService.updatePassword(userId, hashedPassword);
    
    res.json({ message: '密码已成功更新' });
  } catch (error) {
    console.error('更改密码出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};