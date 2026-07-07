import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import * as authService from '../services/auth.service.js';
import { sendError } from '../utils/errors.js';

export const userRouter = Router();

userRouter.use(authMiddleware);
userRouter.use(adminMiddleware);

userRouter.get('/', async (_req, res) => {
  try {
    const users = await authService.listUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    sendError(res, error);
  }
});

userRouter.post('/', async (req, res) => {
  try {
    const user = await authService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    sendError(res, error);
  }
});

userRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await authService.updateUser(String(req.params.id), req.body, req.user!.id);
    res.json({ success: true, data: user });
  } catch (error) {
    sendError(res, error);
  }
});

userRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await authService.deleteUser(String(req.params.id), req.user!.id);
    res.json({ success: true, data: null });
  } catch (error) {
    sendError(res, error);
  }
});
