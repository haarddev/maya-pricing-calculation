import './config/env.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import type { AuthRequest } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { customerRouter } from './routes/customer.routes.js';
import { logRouter } from './routes/log.routes.js';
import { pricingRouter } from './routes/pricing.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { templateRouter } from './routes/template.routes.js';
import { userRouter } from './routes/user.routes.js';
import * as logService from './services/log.service.js';
import { ensureSettings } from './services/settings.service.js';
import { AppError, sendError } from './utils/errors.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRouter);
app.use('/api/templates', templateRouter);
app.use('/api/customers', customerRouter);
app.use('/api/catalogs', catalogRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/logs', logRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/users', userRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
});

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const authReq = req as AuthRequest;
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';

  void logService.logError({
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorMessage: message,
    userId: authReq.user?.id,
    requestBody: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
  });

  sendError(res, err);
});

void ensureSettings().catch((error) => {
  console.error('Failed to ensure app settings:', error);
});

void logService.seedDummyLogsIfNeeded().catch((error) => {
  console.error('Failed to seed dummy logs:', error);
});

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
