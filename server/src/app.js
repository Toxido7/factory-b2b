import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import authRoutes from './modules/auth/auth.routes.js';
import cookieParser from 'cookie-parser';
import { authenticate } from './middlewares/authenticate.js';
import { authorize } from './middlewares/authorize.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import categoriesAdminRoutes from './modules/categories/categories.admin.routes.js';
import productsAdminRoutes from './modules/products/products.admin.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import { uploadDir } from './utils/imageStorage.js';
import requestsRoutes from './modules/requests/requests.routes.js';
import requestsAdminRoutes from './modules/requests/requests.admin.routes.js';
import usersAdminRoutes from './modules/users/users.admin.routes.js';
const app = express();
const adminOnly = [authenticate, authorize('ADMIN')];
app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(
  '/uploads',
  express.static(uploadDir, {
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin/categories', adminOnly, categoriesAdminRoutes);

app.use('/api/products', productsRoutes);
app.use('/api/admin/products', adminOnly, productsAdminRoutes);

// ...after the products route:
app.use('/api/requests', authenticate, authorize('USER'), requestsRoutes);

// ...with the other admin mounts:
app.use('/api/admin/requests', adminOnly, requestsAdminRoutes);
app.use('/api/admin/users', adminOnly, usersAdminRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
