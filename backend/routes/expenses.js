import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

// All routes in this file will be protected by the authMiddleware
router.use(authMiddleware);

router.post('/', async (req, res) => {
  // Get expense details from the request body
  const { amount, currency, category, description, expense_date } = req.body;
  
  // Get the employee's ID from the authenticated user (provided by middleware)
  const employeeId = req.user.userId;

  // Basic validation
  if (!amount || !currency || !category || !expense_date) {
    return res.status(400).json({ message: 'Missing required expense fields.' });
  }

  try {
    const query = `
      INSERT INTO expenses (employee_id, amount, currency, category, description, expense_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *; 
    `;
    const values = [employeeId, amount, currency, category, description, expense_date];

    const result = await db.query(query, values);
    const newExpense = result.rows[0];

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error submitting expense:', error);
    res.status(500).json({ message: 'Server error while submitting expense.' });
  }
});


// GET /api/expenses/my-expenses - Get all expenses for the logged-in user
router.get('/my-expenses', async (req, res) => {
  // The user's ID is available from the authMiddleware
  const employeeId = req.user.userId;

  try {
    const query = `
      SELECT * FROM expenses 
      WHERE employee_id = $1 
      ORDER BY expense_date DESC;
    `;
    
    const result = await db.query(query, [employeeId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error while fetching expenses.' });
  }
});

export default router;