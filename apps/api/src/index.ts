import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { ApiResponse } from '@shopsphere/shared-types';

import productsRouter from './routes/products';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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

// Routes
app.use('/api/products', productsRouter);
app.use('/auth', authRouter);

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
