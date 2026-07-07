import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env.js';
import { getUserById, type AuthUser } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';

export type AuthRequest = Request & { user?: AuthUser };

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role?: UserRole;
};

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await getUserById(payload.sub);

    if (!user) {
      throw new AppError(401, 'Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'Invalid token'));
  }
}
