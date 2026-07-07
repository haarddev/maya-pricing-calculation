import { LogCategory } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as logService from '../services/log.service.js';
import { sendError } from '../utils/errors.js';

export const logRouter = Router();

logRouter.use(authMiddleware);

logRouter.get('/stats', async (_req, res) => {
  try {
    const stats = await logService.getLogStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    sendError(res, error);
  }
});

logRouter.get('/', async (req, res) => {
  try {
    const category = req.query.category as LogCategory | undefined;
    const search = req.query.search as string | undefined;
    const isDummy =
      req.query.isDummy === 'true' ? true : req.query.isDummy === 'false' ? false : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const logs = await logService.listLogs({ category, search, isDummy, limit });
    res.json({ success: true, data: logs });
  } catch (error) {
    sendError(res, error);
  }
});
