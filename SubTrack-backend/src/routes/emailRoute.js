import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户的邮箱连接
router.get('/connections', emailController.getUserConnections);

// 获取授权URL
router.get('/auth-url', emailController.getAuthUrl);

// 处理OAuth回调
router.post('/callback', emailController.handleCallback);

// 开始导入邮件
router.post('/imports/:connectionId', emailController.startImport);

// 获取导入状态
router.get('/imports/:importId', emailController.getImportStatus);

// 删除邮箱连接
router.delete('/connections/:connectionId', emailController.removeConnection);

export default router;