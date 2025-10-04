import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import crypto from 'crypto';
import { createTestTransporter } from '../utils/mailer.js';

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

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // IMPORTANT: Don't reveal that the user doesn't exist.
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    const user = userResult.rows[0];

    // 1. Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 2. Set token expiry (e.g., 1 hour)
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // 3. Save the hashed token and expiry date to the database
    await db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [hashedToken, passwordResetExpires, user.id]
    );

    // 4. Send the email
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n${resetUrl}`;
    
    const transporter = await createTestTransporter();
    await transporter.sendMail({
      from: '"ExpenseManager" <noreply@expensemanager.com>',
      to: user.email,
      subject: 'Password Reset Request',
      text: message,
    });

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // 1. Hash the incoming token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // 2. Find the user by the hashed token and check expiry date
    const userResult = await db.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }
    const user = userResult.rows[0];

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Update the user's password and clear the reset token fields
    await db.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export { signup, login, forgotPassword, resetPassword };