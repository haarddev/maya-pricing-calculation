import { UserRole } from '@prisma/client';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { AppError } from '../utils/errors.js';

export function adminMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    next(new AppError(403, 'Admin access required'));
    return;
  }

  next();
}
