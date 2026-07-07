import type { NextFunction, Request, Response } from 'express';
import { LogCategory } from '@prisma/client';
import type { AuthRequest } from './auth.js';
import { createLog } from '../services/log.service.js';

const SKIP_PATHS = ['/health'];

function shouldLog(path: string) {
  return !SKIP_PATHS.some((skip) => path.startsWith(skip));
}

function isExternalPricingPath(path: string) {
  return path.startsWith('/api/pricing');
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (!shouldLog(req.path)) {
    next();
    return;
  }

  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const isExternal = isExternalPricingPath(req.path);

    void createLog({
      category: LogCategory.INCOMING_REQUEST,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      source: isExternal ? 'external' : 'internal',
      requestBody: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
      durationMs,
      userId,
      errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
    });

    if (res.statusCode < 400) {
      void createLog({
        category: LogCategory.OUTGOING_RESPONSE,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        source: isExternal ? 'maya-pricing-engine' : 'internal-api',
        responseBody: { success: res.statusCode < 400 },
        durationMs,
        userId,
      });
    }
  });

  next();
}
