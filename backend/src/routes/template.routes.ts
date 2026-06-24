import { PricingMethod, TemplateStatus } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import * as templateService from '../services/template.service.js';
import { sendError } from '../utils/errors.js';

export const templateRouter = Router();

templateRouter.use(authMiddleware);

templateRouter.get('/', async (req, res) => {
  try {
    const status = req.query.status as TemplateStatus | undefined;
    const pricingMethod = req.query.pricingMethod as PricingMethod | undefined;
    const search = req.query.search as string | undefined;

    const templates = await templateService.listTemplates({
      status,
      pricingMethod,
      search,
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.get('/:id', async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.json({ success: true, data: template });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const template = await templateService.createTemplate(req.body, req.user!.id);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.put('/:id', async (req, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.delete('/:id', async (req, res) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.post('/:id/fields', async (req, res) => {
  try {
    const field = await templateService.addTemplateField(req.params.id, req.body);
    res.status(201).json({ success: true, data: field });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.put('/:id/fields/:fieldId', async (req, res) => {
  try {
    const field = await templateService.updateTemplateField(
      req.params.id,
      req.params.fieldId,
      req.body,
    );
    res.json({ success: true, data: field });
  } catch (error) {
    sendError(res, error);
  }
});

templateRouter.delete('/:id/fields/:fieldId', async (req, res) => {
  try {
    await templateService.deleteTemplateField(req.params.id, req.params.fieldId);
    res.json({ success: true, data: null });
  } catch (error) {
    sendError(res, error);
  }
});
