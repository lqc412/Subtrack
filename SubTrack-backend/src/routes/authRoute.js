// src/routes/authRoute.js
import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// 注册新用户
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 用户登出
router.post('/logout', authController.logout);

// 验证当前令牌是否有效
router.get('/verify', authController.verifyToken);

export default router;