// src/routes/subsRoute.js
import express from 'express';
import * as subsController from '../controllers/subsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 添加认证中间件到所有订阅路由
router.use(authenticateToken);

// 获取当前用户的所有订阅
router.get('/subs', subsController.getSubs);

// 创建新订阅
router.post('/subs', subsController.createSubs);

// 更新订阅
router.put('/subs/:id', subsController.updateSubs);

// 删除订阅
router.delete('/subs/:id', subsController.deleteSubs);

// 搜索订阅
router.get('/subs/search', subsController.searchSubs); 

export default router;