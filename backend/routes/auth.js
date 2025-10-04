import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { companyName, currency, fullName, email, password } = req.body;

  // Basic validation
  if (!companyName || !currency || !fullName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const client = await db.pool.connect();

  try {
    // Start a database transaction
    await client.query('BEGIN');

    // Create the new company
    const companyQuery = 'INSERT INTO companies (name, default_currency) VALUES ($1, $2) RETURNING id';
    const companyResult = await client.query(companyQuery, [companyName, currency]);
    const newCompanyId = companyResult.rows[0].id;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the new admin user
    const userQuery = 'INSERT INTO users (company_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, role';
    const userResult = await client.query(userQuery, [newCompanyId, fullName, email, passwordHash, 'ADMIN']);
    const newUser = userResult.rows[0];

    // Commit the transaction
    await client.query('COMMIT');

    // Generate a JWT
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, userId: newUser.id, message: 'Company and Admin user created successfully!' });

  } catch (error) {
    // If anything fails, roll back the transaction
    await client.query('ROLLBACK');
    console.error(error);
    // Check for unique email violation
    if (error.code === '23505') {
       return res.status(409).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: 'Server error during signup.' });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Find the user by email
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Use a generic message
    }

    const user = userResult.rows[0];

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Generate a JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, userId: user.id, message: 'Logged in successfully!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

export default router;