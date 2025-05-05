// src/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import subsRoute from './routes/subsRoute.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS 配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 中间件
app.use(express.json());
app.use(cookieParser());

// 路由
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api', subsRoute);

// 基础路由，用于健康检查
app.get('/', (req, res) => {
  res.send('SubTrack API 运行正常');
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器在端口 ${port} 上运行`);
});