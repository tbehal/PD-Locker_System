import { Router, Request, Response, NextFunction } from 'express';
import validate from '../middleware/validate';
import respond from '../middleware/respond';
import * as schema from '../schemas/bookings';
import * as bookingService from '../services/bookingService';
import type { BookSlotsInput, UnbookSlotsInput, FindBlocksInput } from '../types';

const router = Router();

/**
 * @openapi
 * /api/v1/availability/book:
 *   post:
 *     tags: [Bookings]
 *     summary: Book slot(s) for a trainee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycleId, stationId, shift, weeks, traineeName]
 *             properties:
 *               cycleId:
 *                 type: integer
 *               stationId:
 *                 type: integer
 *               shift:
 *                 type: string
 *                 enum: [AM, PM]
 *               weeks:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *               traineeName:
 *                 type: string
 *               contactId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Booking result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  '/book',
  validate(schema.book),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.bookSlots(req.body as BookSlotsInput);
      respond.ok(res, result, 'Slot(s) booked successfully.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/availability/unbook:
 *   post:
 *     tags: [Bookings]
 *     summary: Remove booking(s)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycleId, stationId, shift, weeks]
 *             properties:
 *               cycleId:
 *                 type: integer
 *               stationId:
 *                 type: integer
 *               shift:
 *                 type: string
 *                 enum: [AM, PM]
 *               weeks:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *     responses:
 *       200:
 *         description: Unbook result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/unbook',
  validate(schema.unbook),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.unbookSlots(req.body as UnbookSlotsInput);
      respond.ok(res, result, 'Slot(s) unbooked successfully.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/availability/find:
 *   post:
 *     tags: [Bookings]
 *     summary: Find available consecutive blocks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycleId, shift, labType, side, startWeek, endWeek, weeksNeeded]
 *             properties:
 *               cycleId:
 *                 type: integer
 *               shift:
 *                 type: string
 *                 enum: [AM, PM]
 *               labType:
 *                 type: string
 *               side:
 *                 type: string
 *               startWeek:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               endWeek:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               weeksNeeded:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       200:
 *         description: Available consecutive blocks
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ListResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AvailableBlock'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/find',
  validate(schema.find),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await bookingService.findAvailableBlocks(req.body as FindBlocksInput);
      respond.list(res, results, 'Available blocks found.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/availability/reset:
 *   post:
 *     tags: [Bookings]
 *     summary: Clear all bookings for a cycle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycleId]
 *             properties:
 *               cycleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reset result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         cycleName:
 *                           type: string
 *                         deletedCount:
 *                           type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/reset',
  validate(schema.reset),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cycleId } = req.body as { cycleId: number };
      const result = await bookingService.resetCycle(cycleId);
      respond.ok(res, result, `All bookings for ${result.cycleName} have been cleared.`);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
