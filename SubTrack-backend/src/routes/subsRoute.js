import express from 'express';
import * as subsController from '../controllers/subsController.js';

const router = express.Router();

router.get('/subs', subsController.getSubs);
router.post('/subs', subsController.createSubs);
router.put('/subs/:id', subsController.updateSubs);
router.delete('/subs/:id', subsController.deleteSubs);
router.get('/subs/search', subsController.searchSubs); 

export default router;