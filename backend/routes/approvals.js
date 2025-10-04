import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import db from '../db.js';

const router = Router();
router.use(authMiddleware);

// GET /api/approvals - Get expenses awaiting approval for the logged-in manager
router.get('/', async (req, res) => {
  // The logged-in user's ID is the manager's ID
  const managerId = req.user.userId;

  try {
    const query = `
      SELECT e.*, u.full_name as employee_name
      FROM expenses e
      JOIN users u ON e.employee_id = u.id
      WHERE u.manager_id = $1 AND e.status = 'PENDING'
      ORDER BY e.created_at DESC;
    `;
    
    const result = await db.query(query, [managerId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    res.status(500).json({ message: 'Server error while fetching approval queue.' });
  }
});

export default router;