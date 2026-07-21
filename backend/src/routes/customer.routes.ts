import { CustomerStatus } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import * as customerService from '../services/customer.service.js';
import { sendError } from '../utils/errors.js';

export const customerRouter = Router();

customerRouter.use(authMiddleware);

customerRouter.get('/', async (req, res) => {
  try {
    const status = req.query.status as CustomerStatus | undefined;
    const search = req.query.search as string | undefined;
    const customers = await customerService.listCustomers({ status, search });
    res.json({ success: true, data: customers });
  } catch (error) {
    sendError(res, error);
  }
});

customerRouter.get('/:id', async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
});

customerRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const customer = await customerService.createCustomer(req.body, req.user!.id);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
});

customerRouter.put('/:id', async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
});

customerRouter.delete('/:id', async (req, res) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    sendError(res, error);
  }
});
