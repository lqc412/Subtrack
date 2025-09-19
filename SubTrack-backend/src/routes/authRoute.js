import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// POST /register - register a new user
router.post('/register', authController.register);

// POST /login - log in a user
router.post('/login', authController.login);

// POST /logout - log out a user
router.post('/logout', authController.logout);

// POST /forgot-password - start reset flow
router.post('/forgot-password', authController.requestPasswordReset);

// POST /reset-password - finish reset flow
router.post('/reset-password', authController.resetPassword);

// GET /verify - verify if current token is valid
router.get('/verify', authController.verifyToken);

export default router;
