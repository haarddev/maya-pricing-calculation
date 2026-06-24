import { Router } from 'express';
import * as authService from '../services/auth.service.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { sendError } from '../utils/errors.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    sendError(res, error);
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error);
  }
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    sendError(res, error);
  }
});
