import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { ApiResponse } from '@shopsphere/shared-types';

import productsRouter from './routes/products';
import authRouter from './routes/auth';
import paymentRouter from './routes/payment';
import profileRouter from './routes/profile';
import sellerRouter from './routes/seller';
import adminRouter from './routes/admin';
import enterpriseRouter from './routes/enterprise';
import aiRouter from './routes/ai';

import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: 'Too many requests from this IP address. Please try again after 15 minutes.' }
});

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/api', limiter);

// Routes
app.use('/api/products', productsRouter);
app.use('/auth', authRouter);
app.use('/api', paymentRouter);
app.use('/api', profileRouter);
app.use('/api', sellerRouter);
app.use('/api', adminRouter);
app.use('/api', enterpriseRouter);
app.use('/api', aiRouter);

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; uptime: number }> = {
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'UP',
      uptime: process.uptime(),
    },
  };
  res.status(200).json(response);
});

// Start Server
app.listen(PORT, () => {
  console.log(`[ShopSphere API] Server running on port ${PORT}`);
});
