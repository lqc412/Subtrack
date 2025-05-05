// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authService from '../services/authServices.js';

// 用户注册
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }
    
    // 密码哈希处理
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户
    const newUser = await authService.createUser({ 
      username, 
      email, 
      password_hash: hashedPassword 
    });
    
    // 创建默认用户设置
    await authService.createUserSettings(newUser.id);
    
    // 生成并存储令牌
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
    console.error('注册过程中出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 用户登录
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 通过邮箱查找用户
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }
    
    // 生成并存储令牌
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
    console.error('登录过程中出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 用户登出
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await authService.deleteToken(token);
    }
    
    res.json({ message: '成功登出' });
  } catch (error) {
    console.error('登出过程中出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 验证令牌
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未提供访问令牌' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      // 检查令牌是否存在于数据库中
      const tokenExists = await authService.findToken(token);
      if (!tokenExists) {
        return res.status(401).json({ message: '无效或过期的令牌' });
      }
      
      // 获取用户信息
      const user = await authService.findUserById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      return res.status(403).json({ message: '无效的令牌' });
    }
  } catch (error) {
    console.error('验证令牌过程中出错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your_jwt_secret', 
    { expiresIn: '7d' }
  );
};