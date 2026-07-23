import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { getVehicleTrips } from '../services/ituran.service.js';
import { verifyTripsWithIturan } from '../services/ituran-pricing.service.js';
import { sendError } from '../utils/errors.js';

export const ituranRouter = Router();

ituranRouter.use(authMiddleware);

ituranRouter.post('/verify-trips', async (req, res) => {
  try {
    const data = await verifyTripsWithIturan(req.body);
    res.json({ success: true, data });
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

ituranRouter.get('/vehicles/:plate/trips', async (req, res) => {
  try {
    const plate = req.params.plate;
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: 'Query params "from" and "to" are required (ISO datetime)',
      });
      return;
    }

    const trips = await getVehicleTrips(plate, from, to);
    res.json({
      success: true,
      data: {
        license_plate: plate,
        from,
        to,
        trip_count: trips.length,
        trips,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
});
