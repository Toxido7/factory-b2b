import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import authRoutes from './modules/auth/auth.routes.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
