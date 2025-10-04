import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { submitExpense, getMyExpenses } from '../controllers/expenseController.js';

const router = Router();

// All routes in this file are protected
router.use(authMiddleware);

// POST /api/expenses - Submit a new expense
router.post('/', submitExpense);

// GET /api/expenses/my-expenses - Get all expenses for the logged-in user
router.get('/my-expenses', getMyExpenses);

export default router;