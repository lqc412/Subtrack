// Updated main server file with subscription auto-update job
// File: SubTrack-backend/src/index.js

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import subsRoute from './routes/subsRoute.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import emailRoute from './routes/emailRoute.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSubscriptionJobs, getJobStatus, triggerJobUpdate } from './jobs/subscriptionUpdateJob.js';

const app = express();
const port = process.env.PORT || 3000;

// Get current file directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir);
}

// Add static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api', subsRoute);
app.use('/api/email', emailRoute);

// Admin/monitoring routes for subscription jobs
app.get('/api/admin/job-status', (req, res) => {
  try {
    const status = getJobStatus();
    res.json({
      success: true,
      jobStatus: status,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

// Manual trigger for subscription updates (admin only)
app.post('/api/admin/trigger-update', async (req, res) => {
  try {
    console.log('Manual subscription update triggered via API');
    await triggerJobUpdate();
    res.json({
      success: true,
      message: 'Subscription update job triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to trigger manual update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger subscription update',
      error: error.message
    });
  }
});

// Root route - health check with job status
app.get('/', (req, res) => {
  const jobStatus = getJobStatus();
  res.json({
    message: 'SubTrack API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    jobStatus: {
      isRunning: jobStatus.isRunning,
      lastRun: jobStatus.lastRun,
      totalRuns: jobStatus.totalRuns,
      totalUpdated: jobStatus.totalUpdated
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Initialize subscription auto-update jobs
console.log('Initializing subscription auto-update jobs...');
const jobsInitialized = initializeSubscriptionJobs();

if (jobsInitialized) {
  console.log('✅ Subscription auto-update jobs initialized successfully');
} else {
  console.error('❌ Failed to initialize subscription auto-update jobs');
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  // Add cleanup for cron jobs here if needed
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  // Add cleanup for cron jobs here if needed
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Health check available at http://localhost:${port}/health`);
  console.log(`🔧 Job status available at http://localhost:${port}/api/admin/job-status`);
  console.log(`⏰ Subscription auto-update job is ${jobsInitialized ? 'active' : 'inactive'}`);
});