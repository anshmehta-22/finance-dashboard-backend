import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary
 *     description: Returns total income, total expenses, and net balance. Requires `dashboard:read` permission.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     netBalance:
 *                       type: number
 *                   required: [totalIncome, totalExpenses, netBalance]
 *               required: [message, data]
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden for current role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Route not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/summary',
  authMiddleware,
  rbac('dashboard:read'),
  (req, res, next) => dashboardController.getSummary(req, res, next)
);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown
 *     description: Returns grouped income and expense totals by category. Requires `dashboard:read` permission.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     income:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 *                     expenses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 *                   required: [income, expenses]
 *               required: [message, data]
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden for current role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Route not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/by-category',
  authMiddleware,
  rbac('dashboard:read'),
  (req, res, next) => dashboardController.getByCategory(req, res, next)
);

router.get(
  '/categories',
  authMiddleware,
  rbac('dashboard:read'),
  (req, res, next) => dashboardController.getByCategory(req, res, next)
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard trends
 *     description: Returns trends aggregated by month or ISO week. Requires `dashboard:insights` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly]
 *           default: monthly
 *         description: Aggregation period.
 *     responses:
 *       200:
 *         description: Dashboard trends retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       income:
 *                         type: number
 *                       expenses:
 *                         type: number
 *                       net:
 *                         type: number
 *                     required: [period, income, expenses, net]
 *               required: [message, data]
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden for current role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Route not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/trends',
  authMiddleware,
  rbac('dashboard:insights'),
  (req, res, next) => dashboardController.getTrends(req, res, next)
);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent dashboard activity
 *     description: Returns the latest 10 records with creator email. Requires `dashboard:read` permission.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     records:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/FinancialRecord'
 *                           - type: object
 *                             properties:
 *                               createdBy:
 *                                 type: object
 *                                 properties:
 *                                   email:
 *                                     type: string
 *                                     format: email
 *                                 required: [email]
 *                   required: [records]
 *               required: [message, data]
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden for current role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Route not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/recent',
  authMiddleware,
  rbac('dashboard:read'),
  (req, res, next) => dashboardController.getRecentActivity(req, res, next)
);

export default router;
