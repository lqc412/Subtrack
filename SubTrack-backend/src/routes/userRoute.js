import express from 'express';
import multer from 'multer';
import path from 'path';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Filter to only accept image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
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