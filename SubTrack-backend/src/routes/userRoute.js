// src/routes/userRoute.js
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有用户路由都需要认证
router.use(authenticateToken);

// 获取当前用户信息
router.get('/me', userController.getCurrentUser);

// 更新用户个人资料
router.put('/profile', userController.updateProfile);

// 获取用户设置
router.get('/preferences', userController.getUserPreferences);

// 更新用户设置
router.put('/preferences', userController.updateUserPreferences);

// 更改密码
router.put('/password', userController.changePassword);

export default router;