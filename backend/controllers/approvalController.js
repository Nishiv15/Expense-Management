import db from '../db.js';

// Controller to get the manager's approval queue
const getApprovalQueue = async (req, res) => {
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
};

// Controller to approve an expense
const approveExpense = async (req, res) => {
  const { expenseId } = req.params;
  const managerId = req.user.userId;

  try {
    const updateQuery = `
      UPDATE expenses e SET status = 'APPROVED' FROM users u
      WHERE e.id = $1 AND e.employee_id = u.id AND u.manager_id = $2 AND e.status = 'PENDING'
      RETURNING e.*;
    `;
    
    const result = await db.query(updateQuery, [expenseId, managerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Expense not found or you are not authorized to approve it.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({ message: 'Server error while approving expense.' });
  }
};

// Controller to reject an expense
const rejectExpense = async (req, res) => {
  const { expenseId } = req.params;
  const { comments } = req.body;
  const managerId = req.user.userId;

  if (!comments) {
    return res.status(400).json({ message: 'Comments are required for rejection.' });
  }

  try {
    const updateQuery = `
      UPDATE expenses e SET status = 'REJECTED', comments = $1 FROM users u
      WHERE e.id = $2 AND e.employee_id = u.id AND u.manager_id = $3 AND e.status = 'PENDING'
      RETURNING e.*;
    `;
    
    const result = await db.query(updateQuery, [comments, expenseId, managerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Expense not found or you are not authorized to reject it.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({ message: 'Server error while rejecting expense.' });
  }
};

export { getApprovalQueue, approveExpense, rejectExpense };