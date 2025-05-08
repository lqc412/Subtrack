import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's email connections
router.get('/connections', emailController.getUserConnections);

// Get authorization URL
router.get('/auth-url', emailController.getAuthUrl);

// Handle OAuth callback
router.post('/callback', emailController.handleCallback);

// Start email import
router.post('/imports/:connectionId', emailController.startImport);

// Get import status
router.get('/imports/:importId', emailController.getImportStatus);

// NEW ENDPOINT: Get recently detected subscriptions
router.get('/recent-subscriptions', emailController.getRecentSubscriptions);

// Remove email connection
router.delete('/connections/:connectionId', emailController.removeConnection);

export default router;