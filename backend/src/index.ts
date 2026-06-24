import './config/env.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { templateRouter } from './routes/template.routes.js';
import { AppError, sendError } from './utils/errors.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRouter);
app.use('/api/templates', templateRouter);
app.use('/api/catalogs', catalogRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  sendError(res, err);
});

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
