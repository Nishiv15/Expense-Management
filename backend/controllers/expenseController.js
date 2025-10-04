import db from '../db.js';

// Controller to submit a new expense
const submitExpense = async (req, res) => {
  const { amount, currency, category, description, expense_date } = req.body;
  const employeeId = req.user.userId;

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
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting expense:', error);
    res.status(500).json({ message: 'Server error while submitting expense.' });
  }
};

// Controller to get all expenses for the logged-in user
const getMyExpenses = async (req, res) => {
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
};

export { submitExpense, getMyExpenses };