import { Router, Request, Response, NextFunction } from 'express';
import validate from '../middleware/validate';
import respond from '../middleware/respond';
import * as schema from '../schemas/registration';
import * as registrationService from '../services/registrationService';

const router = Router();

/**
 * @openapi
 * /api/v1/cycles/{cycleId}/registration:
 *   get:
 *     tags: [Registration]
 *     summary: Get registration list for a cycle
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *           enum: [AM, PM]
 *           default: AM
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: string
 *           enum: [true]
 *         description: Force cache refresh
 *     responses:
 *       200:
 *         description: Registration list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RegistrationResult'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:cycleId/registration',
  validate(schema.registrationParams, 'params'),
  validate(schema.registrationQuery, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycleId = Number(req.params.cycleId);
      const shift = req.query.shift as string;
      const refresh = req.query.refresh as string | undefined;
      const result = await registrationService.getRegistrationList(
        cycleId,
        shift,
        refresh === 'true',
      );
      respond.ok(res, result, 'Registration list fetched.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/cycles/{cycleId}/registration/export:
 *   get:
 *     tags: [Registration]
 *     summary: Export registration list as CSV
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *           enum: [AM, PM]
 *           default: AM
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:cycleId/registration/export',
  validate(schema.registrationParams, 'params'),
  validate(schema.exportQuery, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycleId = Number(req.params.cycleId);
      const shift = req.query.shift as string;
      const { csv, cycleName } = await registrationService.exportRegistrationCsv(cycleId, shift);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${cycleName}-${shift}-registration.csv"`,
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
