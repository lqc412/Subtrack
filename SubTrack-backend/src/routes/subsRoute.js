// Enhanced subscription routes with auto-update endpoints
// File: SubTrack-backend/src/routes/subsRoute.js

import express from 'express';
import * as subsController from '../controllers/subsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes below require authentication
router.use(authenticateToken);

// GET /subs - get all subscriptions for current user (with auto-update)
router.get('/subs', subsController.getSubs);

// POST /subs - create a new subscription
router.post('/subs', subsController.createSubs);

// PUT /subs/:id - update a subscription by ID
router.put('/subs/:id', subsController.updateSubs);

// DELETE /subs/:id - delete a subscription by ID
router.delete('/subs/:id', subsController.deleteSubs);

// GET /subs/search - search subscriptions (with auto-update)
router.get('/subs/search', subsController.searchSubs);

// GET /subs/upcoming - get upcoming subscriptions within specified days
router.get('/subs/upcoming', subsController.getUpcomingSubs);

// GET /subs/stats - get subscription statistics (with auto-update)
router.get('/subs/stats', subsController.getSubsStats);

// GET /subs/categories - get subscriptions grouped by category (with auto-update)
router.get('/subs/categories', subsController.getSubsByCategory);

// POST /subs/update-dates - manually trigger date updates for user's subscriptions
router.post('/subs/update-dates', subsController.updateSubDates);

// EMAIL INTEGRATION ENDPOINTS

// GET /subs/recent - get recently detected subscriptions from email
router.get('/subs/recent', subsController.getRecentSubscriptions);

// POST /subs/batch - create multiple subscriptions at once
router.post('/subs/batch', subsController.createBatchSubscriptions);

// POST /subs/ai/chat - converse with AI spend advisor
router.post('/subs/ai/chat', subsController.chatWithSpendAdvisor);

export default router;