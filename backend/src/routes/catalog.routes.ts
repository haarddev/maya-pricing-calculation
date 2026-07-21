import { CatalogStatus } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import * as catalogService from '../services/catalog.service.js';
import { sendError } from '../utils/errors.js';

export const catalogRouter = Router();

catalogRouter.use(authMiddleware);

catalogRouter.get('/templates', async (_req, res) => {
  try {
    const templates = await catalogService.listTemplatesForCatalog();
    res.json({ success: true, data: templates });
  } catch (error) {
    sendError(res, error);
  }
});

catalogRouter.get('/', async (req, res) => {
  try {
    const status = req.query.status as CatalogStatus | undefined;
    const templateId = req.query.templateId as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const search = req.query.search as string | undefined;

    const catalogs = await catalogService.listCatalogs({
      status,
      templateId,
      customerId,
      search,
    });
    res.json({ success: true, data: catalogs });
  } catch (error) {
    sendError(res, error);
  }
});

catalogRouter.post('/preview', async (req, res) => {
  try {
    const { templateId, fieldValues } = req.body as {
      templateId: string;
      fieldValues: Record<string, unknown>;
    };
    const preview = await catalogService.previewCatalogPrice(templateId, fieldValues);
    res.json({ success: true, data: preview });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Field ')) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    sendError(res, error);
  }
});

catalogRouter.get('/:id', async (req, res) => {
  try {
    const catalog = await catalogService.getCatalogById(req.params.id);
    res.json({ success: true, data: catalog });
  } catch (error) {
    sendError(res, error);
  }
});

catalogRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const catalog = await catalogService.createCatalog(req.body, req.user!.id);
    res.status(201).json({ success: true, data: catalog });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Field ')) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    sendError(res, error);
  }
});

catalogRouter.put('/:id', async (req, res) => {
  try {
    const catalog = await catalogService.updateCatalog(req.params.id, req.body);
    res.json({ success: true, data: catalog });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Field ')) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    sendError(res, error);
  }
});

catalogRouter.delete('/:id', async (req, res) => {
  try {
    await catalogService.deleteCatalog(req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    sendError(res, error);
  }
});
