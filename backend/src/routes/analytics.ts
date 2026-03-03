import { Router, Request, Response, NextFunction } from 'express';
import validate from '../middleware/validate';
import respond from '../middleware/respond';
import * as schema from '../schemas/analytics';
import * as analyticsService from '../services/analyticsService';

const router = Router();

/**
 * @openapi
 * /api/v1/analytics/seating:
 *   get:
 *     tags: [Analytics]
 *     summary: Get seating occupancy analytics
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2100
 *       - in: query
 *         name: cycleId
 *         schema:
 *           type: integer
 *         description: Filter to a specific cycle
 *     responses:
 *       200:
 *         description: Seating analytics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SeatingAnalyticsResult'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/seating',
  validate(schema.seatingQuery, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = Number(req.query.year);
      const cycleId = req.query.cycleId ? Number(req.query.cycleId) : null;
      const result = await analyticsService.getSeatingAnalytics(year, cycleId);
      respond.ok(res, result, 'Seating analytics fetched.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/analytics/registration:
 *   get:
 *     tags: [Analytics]
 *     summary: Get registration analytics
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2100
 *       - in: query
 *         name: shift
 *         required: true
 *         schema:
 *           type: string
 *           enum: [AM, PM, BOTH]
 *       - in: query
 *         name: cycleId
 *         schema:
 *           type: integer
 *         description: Filter to a specific cycle
 *     responses:
 *       200:
 *         description: Registration analytics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RegistrationAnalyticsResult'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/registration',
  validate(schema.registrationQuery, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = Number(req.query.year);
      const shift = req.query.shift as string;
      const cycleId = req.query.cycleId ? Number(req.query.cycleId) : null;
      const result = await analyticsService.getRegistrationAnalytics(year, shift, cycleId);
      respond.ok(res, result, 'Registration analytics fetched.');
    } catch (err) {
      next(err);
    }
  },
);

export default router;
