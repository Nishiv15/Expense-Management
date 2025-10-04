import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

// Controller for the Signup logic
const signup = async (req, res) => {
  const { companyName, currency, fullName, email, password } = req.body;

  if (!companyName || !currency || !fullName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const companyQuery = 'INSERT INTO companies (name, default_currency) VALUES ($1, $2) RETURNING id';
    const companyResult = await client.query(companyQuery, [companyName, currency]);
    const newCompanyId = companyResult.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userQuery = 'INSERT INTO users (company_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, role';
    const userResult = await client.query(userQuery, [newCompanyId, fullName, email, passwordHash, 'ADMIN']);
    const newUser = userResult.rows[0];

    await client.query('COMMIT');

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, userId: newUser.id, message: 'Company and Admin user created successfully!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
       return res.status(409).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: 'Server error during signup.' });
  } finally {
    client.release();
  }
};

// Controller for the Login logic
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role, companyId: user.company_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userId: user.id, message: 'Logged in successfully!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

export { signup, login };