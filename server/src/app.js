import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default app;