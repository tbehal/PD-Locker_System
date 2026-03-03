import { Router, Request, Response, NextFunction } from 'express';
import validate from '../middleware/validate';
import respond from '../middleware/respond';
import * as schema from '../schemas/grid';
import * as gridService from '../services/gridService';

const router = Router();

/**
 * @openapi
 * /api/v1/availability/grid:
 *   post:
 *     tags: [Grid]
 *     summary: Build availability grid for a cycle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycleId, shift, labType, side]
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
 *     responses:
 *       200:
 *         description: Grid data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GridResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/grid',
  validate(schema.grid),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cycleId, shift, labType, side } = req.body as {
        cycleId: number;
        shift: string;
        labType: string;
        side: string;
      };
      const data = await gridService.buildGrid(cycleId, shift, labType, side);
      respond.ok(res, data, 'Grid fetched.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/availability/export:
 *   get:
 *     tags: [Grid]
 *     summary: Export grid as CSV
 *     parameters:
 *       - in: query
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: shift
 *         required: true
 *         schema:
 *           type: string
 *           enum: [AM, PM]
 *       - in: query
 *         name: labType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: side
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/export',
  validate(schema.exportQuery, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycleId = Number(req.query.cycleId);
      const shift = req.query.shift as string;
      const labType = req.query.labType as string;
      const side = req.query.side as string;
      const csv = await gridService.exportGrid(cycleId, shift, labType, side);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="cycle-${cycleId}-${shift}-${labType}-export.csv"`,
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
