// src/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import subsRoute from './routes/subsRoute.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/subs', subsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});