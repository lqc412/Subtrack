import express from 'express';
import multer from 'multer';
import path from 'path';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../uploads/avatars/'));
    },
    filename: function (req, file, cb) {
      // 使用用户ID和时间戳创建唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, `avatar-${req.user.id}-${uniqueSuffix}${fileExt}`);
    }
  });
  
  // 过滤器：只接受图像文件
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持上传图像文件!'), false);
    }
  };
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 限制5MB
  });

// All routes below require authentication
router.use(authenticateToken);

// GET /me - get current user info
router.get('/me', userController.getCurrentUser);

// PUT /profile - update profile (with file upload)
router.put('/profile', upload.single('profile_image'), userController.updateProfile);

// 路由配置
router.put('/profile', authenticateToken, upload.single('profile_image'), userController.updateProfile);

// GET /preferences - get user preferences
router.get('/preferences', userController.getUserPreferences);

// PUT /preferences - update user preferences
router.put('/preferences', userController.updateUserPreferences);

// PUT /password - change password
router.put('/password', userController.changePassword);

export default router;