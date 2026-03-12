import { Router, Request, Response, NextFunction } from 'express';
import validate from '../middleware/validate';
import respond from '../middleware/respond';
import * as schema from '../schemas/history';
import * as historyService from '../services/historyService';

const router = Router();

/**
 * @openapi
 * /api/v1/history:
 *   get:
 *     tags: [StudentHistory]
 *     summary: Get booking history for a student
 *     description: Returns all bookings grouped by cycle for a student, identified by contactId or trainee name.
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         description: HubSpot contact ID (provide this OR name, not both)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *         description: Trainee name to search (partial match, provide this OR contactId, not both)
 *     responses:
 *       200:
 *         description: Student booking history grouped by cycle
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HistoryCycleGroup'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  validate(schema.query, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contactId, name } = req.query as { contactId?: string; name?: string };
      const result = await historyService.getStudentHistory({ contactId, name });
      respond.ok(res, result, 'Student history fetched.');
    } catch (err) {
      next(err);
    }
  },
);

export default router;
