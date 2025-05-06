import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import subsRoute from './routes/subsRoute.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';

const app = express();
const port = process.env.PORT || 3000;

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

// Root route - health check
app.get('/', (req, res) => {
  res.send('SubTrack API is running');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
