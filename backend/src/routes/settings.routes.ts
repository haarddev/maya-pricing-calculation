import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import * as settingsService from '../services/settings.service.js';
import { sendError } from '../utils/errors.js';

export const settingsRouter = Router();

settingsRouter.get('/public', async (_req, res) => {
  try {
    const settings = await settingsService.getPublicSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    sendError(res, error);
  }
});

settingsRouter.use(authMiddleware);

settingsRouter.get('/', async (_req, res) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    sendError(res, error);
  }
});

settingsRouter.put('/', adminMiddleware, async (req, res) => {
  try {
    const settings = await settingsService.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    sendError(res, error);
  }
});
