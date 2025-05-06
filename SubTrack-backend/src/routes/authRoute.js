import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// POST /register - register a new user
router.post('/register', authController.register);

// POST /login - log in a user
router.post('/login', authController.login);

// POST /logout - log out a user
router.post('/logout', authController.logout);

// GET /verify - verify if current token is valid
router.get('/verify', authController.verifyToken);

export default router;
