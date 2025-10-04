import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { getApprovalQueue, approveExpense, rejectExpense } from '../controllers/approvalController.js';

const router = Router();
router.use(authMiddleware);

// GET /api/approvals - Get expenses awaiting approval for the logged-in manager
router.get('/', getApprovalQueue);

// POST /api/approvals/:expenseId/approve - Approve an expense
router.post('/:expenseId/approve', approveExpense);

// POST /api/approvals/:expenseId/reject - Reject an expense
router.post('/:expenseId/reject', rejectExpense);

export default router;