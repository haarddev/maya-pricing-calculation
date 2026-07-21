import { PricingMethod } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import {
  calculateTripPrice,
  listPricingMethods,
  validateAllSyntheticReports,
  validateMethodReport,
  validateMonthlyReport,
} from '../services/pricing.service.js';
import { sendError } from '../utils/errors.js';

export const pricingRouter = Router();

pricingRouter.use(authMiddleware);

pricingRouter.get('/methods', async (_req, res) => {
  try {
    res.json({ success: true, data: listPricingMethods() });
  } catch (error) {
    sendError(res, error);
  }
});

pricingRouter.post('/calculate', async (req: AuthRequest, res) => {
  try {
    const result = await calculateTripPrice(req.body, req.user?.id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      });
      return;
    }
    sendError(res, error);
  }
});

pricingRouter.get('/validate-report', async (req, res) => {
  try {
    const method = req.query.method as string | undefined;

    if (!method || method === 'KIVUNIM' || method === PricingMethod.PRICE_BY_ROUTE) {
      // Default: original Kivunim May report (PRICE_BY_ROUTE)
      if (method === PricingMethod.PRICE_BY_ROUTE) {
        // Synthetic PRICE_BY_ROUTE doesn't exist — Kivunim uses the real report
        const result = await validateMonthlyReport();
        res.json({ success: true, data: result });
        return;
      }
      const result = await validateMonthlyReport();
      res.json({ success: true, data: result });
      return;
    }

    if (method === 'ALL_SYNTHETIC') {
      const results = await validateAllSyntheticReports();
      res.json({ success: true, data: results });
      return;
    }

    if (!Object.values(PricingMethod).includes(method as PricingMethod)) {
      res.status(400).json({ success: false, error: `Unknown pricing method: ${method}` });
      return;
    }

    const result = await validateMethodReport(method as PricingMethod);
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error);
  }
});
