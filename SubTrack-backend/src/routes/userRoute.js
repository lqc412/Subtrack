import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes below require authentication
router.use(authenticateToken);

// GET /user/me - get current user info
router.get('/me', userController.getCurrentUser);

// PUT /user/profile - update profile
router.put('/profile', userController.updateProfile);

// GET /user/preferences - get user preferences
router.get('/preferences', userController.getUserPreferences);

// PUT /user/preferences - update user preferences
router.put('/preferences', userController.updateUserPreferences);

// PUT /user/password - change password
router.put('/password', userController.changePassword);

export default router;
