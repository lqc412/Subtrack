import * as subsService from '../services/subsServices.js';

/**
 * Get all subscriptions for the authenticated user
 */
export const getSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subs = await subsService.getSubs(userId);
    res.status(200).json(subs);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Create a new subscription for the authenticated user
 */
export const createSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subsData = { ...req.body, user_id: userId };
    const newSubs = await subsService.createSubs(subsData);
    res.status(200).json(newSubs);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update a subscription if it belongs to the authenticated user
 */
export const updateSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subsId = parseInt(req.params.id);

    const subscription = await subsService.getSubById(subsId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this subscription' });
    }

    const subsData = req.body;
    const updatedSubs = await subsService.updateSubs(subsData, subsId);

    if (!updatedSubs) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json(updatedSubs);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Delete a subscription if it belongs to the authenticated user
 */
export const deleteSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subsId = req.params.id;

    const subscription = await subsService.getSubById(subsId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this subscription' });
    }

    const deleted = await subsService.deleteSubs(subsId);
    if (!deleted) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Search subscriptions for the authenticated user
 */
export const searchSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const searchTerm = req.query.q;
    const subs = await subsService.searchSubs(searchTerm, userId);
    res.status(200).json(subs);
  } catch (error) {
    console.error('Error searching subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
