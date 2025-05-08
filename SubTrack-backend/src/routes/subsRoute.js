import express from 'express';
import * as subsController from '../controllers/subsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes below require authentication
router.use(authenticateToken);

// GET /subs - get all subscriptions for current user
router.get('/subs', subsController.getSubs);

// POST /subs - create a new subscription
router.post('/subs', subsController.createSubs);

// PUT /subs/:id - update a subscription by ID
router.put('/subs/:id', subsController.updateSubs);

// DELETE /subs/:id - delete a subscription by ID
router.delete('/subs/:id', subsController.deleteSubs);

// GET /subs/search - search subscriptions
router.get('/subs/search', subsController.searchSubs);

// NEW ENDPOINTS FOR EMAIL INTEGRATION

// GET /subs/recent - get recently detected subscriptions from email
router.get('/subs/recent', subsController.getRecentSubscriptions);

// POST /subs/batch - create multiple subscriptions at once
router.post('/subs/batch', subsController.createBatchSubscriptions);

export default router;