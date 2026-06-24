import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function sendError(res: import('express').Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001')
  ) {
    return res.status(503).json({
      success: false,
      error: 'Database unavailable. Check DATABASE_URL and ensure PostgreSQL is running.',
    });
  }

  console.error(error);
  return res.status(500).json({ success: false, error: 'Internal server error' });
}