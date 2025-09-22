import express from 'express';
import multer from 'multer';
import path from 'path';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for avatar uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../uploads/avatars/'));
    },
    filename: function (req, file, cb) {
      // Create a unique filename using the user ID and a timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, `avatar-${req.user.id}-${uniqueSuffix}${fileExt}`);
    }
  });
  
  // Filter: only accept image files
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported!'), false);
    }
  };
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
  });

// All routes below require authentication
router.use(authenticateToken);

// GET /me - get current user info
router.get('/me', userController.getCurrentUser);

// PUT /profile - update profile (with file upload)
router.put('/profile', upload.single('profile_image'), userController.updateProfile);

// GET /preferences - get user preferences
router.get('/preferences', userController.getUserPreferences);

// PUT /preferences - update user preferences
router.put('/preferences', userController.updateUserPreferences);

// PUT /password - change password
router.put('/password', userController.changePassword);

export default router;
