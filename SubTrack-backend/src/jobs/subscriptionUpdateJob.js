// Background job for automatic subscription date updates
// File: SubTrack-backend/src/jobs/subscriptionUpdateJob.js

import cron from 'node-cron';
import { updateOverdueSubscriptions } from '../services/subsServices.js';

/**
 * Background job to automatically update overdue subscription dates
 * Runs daily at 2 AM to update any subscriptions with past due dates
 */
class SubscriptionUpdateJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.jobStats = {
      totalRuns: 0,
      totalUpdated: 0,
      lastError: null
    };
  }

  /**
   * Start the cron job
   */
  start() {
    console.log('Starting subscription auto-update job...');
    
    // Run daily at 2 AM (0 2 * * *)
    // For testing, you can use '*/5 * * * *' to run every 5 minutes
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      await this.runUpdate();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('Subscription auto-update job scheduled to run daily at 2 AM UTC');

    // Also run immediately on startup to catch any overdue subscriptions
    setTimeout(() => {
      this.runUpdate();
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Subscription auto-update job stopped');
    }
  }

  /**
   * Run the update process
   */
  async runUpdate() {
    if (this.isRunning) {
      console.log('Subscription update job already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    
    console.log(`Starting subscription auto-update at ${this.lastRun.toISOString()}`);

    try {
      const result = await updateOverdueSubscriptions();
      
      this.jobStats.totalRuns++;
      this.jobStats.totalUpdated += result.updated;
      this.jobStats.lastError = null;

      console.log(`Subscription auto-update completed: ${result.updated} subscriptions updated`);
      
      // Log summary if any updates were made
      if (result.updated > 0) {
        console.log(`📅 Auto-updated ${result.updated} overdue subscription dates`);
      }

    } catch (error) {
      console.error('Error in subscription auto-update job:', error);
      this.jobStats.lastError = {
        message: error.message,
        timestamp: new Date()
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job statistics
   */
  getStats() {
    let nextRun = null;
    if (this.cronJob && typeof this.cronJob.nextDates === 'function') {
      try {
        const next = this.cronJob.nextDates();
        nextRun = typeof next?.toJSDate === 'function' ? next.toJSDate() : next;
      } catch (error) {
        console.warn('Unable to determine next run time for subscription job:', error);
      }
    }

    return {
      ...this.jobStats,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun
    };
  }

  /**
   * Force run the job manually (for testing or admin triggers)
   */
  async forceRun() {
    console.log('Manually triggering subscription auto-update job...');
    await this.runUpdate();
  }
}

// Create singleton instance
const subscriptionUpdateJob = new SubscriptionUpdateJob();

export default subscriptionUpdateJob;

// Additional utility functions

/**
 * Initialize the subscription update job
 * Call this from your main server file
 */
export const initializeSubscriptionJobs = () => {
  try {
    subscriptionUpdateJob.start();
    return true;
  } catch (error) {
    console.error('Failed to initialize subscription jobs:', error);
    return false;
  }
};

/**
 * Get job status for admin/monitoring endpoints
 */
export const getJobStatus = () => {
  return subscriptionUpdateJob.getStats();
};

/**
 * Manually trigger job update
 */
export const triggerJobUpdate = async () => {
  return await subscriptionUpdateJob.forceRun();
};
