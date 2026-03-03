import { Router, Request, Response, NextFunction } from 'express';
import validate from '../middleware/validate';
import respond from '../middleware/respond';
import * as schema from '../schemas/cycles';
import * as cycleService from '../services/cycleService';

const router = Router();

/**
 * @openapi
 * /api/v1/cycles:
 *   get:
 *     tags: [Cycles]
 *     summary: List all cycles
 *     responses:
 *       200:
 *         description: List of cycles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *             example:
 *               data:
 *                 - id: 1
 *                   name: "2025 Cycle 1"
 *                   year: 2025
 *                   number: 1
 *                   locked: false
 *                   courseCodes: ["NDC"]
 *                   cycleWeeks: []
 *               count: 1
 *               message: Cycles fetched.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cycles = await cycleService.listCycles();
    respond.list(res, cycles, 'Cycles fetched.');
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/cycles:
 *   post:
 *     tags: [Cycles]
 *     summary: Create a new cycle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [year]
 *             properties:
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2100
 *               courseCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Cycle created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               data:
 *                 id: 1
 *                 name: "2025 Cycle 1"
 *                 year: 2025
 *                 number: 1
 *                 locked: false
 *                 courseCodes: ["NDC"]
 *                 cycleWeeks: []
 *               message: Cycle created.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  '/',
  validate(schema.createCycle),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, courseCodes } = req.body as { year: number; courseCodes?: string[] };
      const cycle = await cycleService.createCycle(year, courseCodes);
      respond.created(res, cycle, 'Cycle created.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/cycles/{id}/weeks:
 *   patch:
 *     tags: [Cycles]
 *     summary: Update week dates for a cycle
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [weeks]
 *             properties:
 *               weeks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [week]
 *                   properties:
 *                     week:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 12
 *                     startDate:
 *                       type: string
 *                       nullable: true
 *                     endDate:
 *                       type: string
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Week dates updated
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/weeks',
  validate(schema.idParam, 'params'),
  validate(schema.updateWeeks),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const { weeks } = req.body as {
        weeks: { week: number; startDate?: string | null; endDate?: string | null }[];
      };
      const updated = await cycleService.updateWeeks(id, weeks);
      respond.ok(res, updated, 'Week dates updated.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/cycles/{id}/course-codes:
 *   patch:
 *     tags: [Cycles]
 *     summary: Update course codes for a cycle
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseCodes]
 *             properties:
 *               courseCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Course codes updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/course-codes',
  validate(schema.idParam, 'params'),
  validate(schema.updateCourseCodes),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const { courseCodes } = req.body as { courseCodes: string[] };
      const updated = await cycleService.updateCourseCodes(id, courseCodes);
      respond.ok(res, updated, 'Course codes updated.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/cycles/{id}/lock:
 *   patch:
 *     tags: [Cycles]
 *     summary: Lock a cycle (prevent modifications)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     responses:
 *       200:
 *         description: Cycle locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               data:
 *                 id: 1
 *                 locked: true
 *               message: Cycle locked.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/lock',
  validate(schema.idParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const cycle = await cycleService.setLocked(id, true);
      respond.ok(res, cycle, 'Cycle locked.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/cycles/{id}/unlock:
 *   patch:
 *     tags: [Cycles]
 *     summary: Unlock a cycle
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     responses:
 *       200:
 *         description: Cycle unlocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               data:
 *                 id: 1
 *                 locked: false
 *               message: Cycle unlocked.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/unlock',
  validate(schema.idParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const cycle = await cycleService.setLocked(id, false);
      respond.ok(res, cycle, 'Cycle unlocked.');
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/v1/cycles/{id}:
 *   delete:
 *     tags: [Cycles]
 *     summary: Delete a cycle and all its bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     responses:
 *       200:
 *         description: Cycle deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               data:
 *                 name: "2025 Cycle 1"
 *               message: 2025 Cycle 1 has been deleted.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id',
  validate(schema.idParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const cycle = await cycleService.deleteCycle(id);
      respond.ok(res, { name: cycle.name }, `${cycle.name} has been deleted.`);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
