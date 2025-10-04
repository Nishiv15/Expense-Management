import { Router } from 'express';
import { signup, login, forgotPassword, resetPassword } from '../controllers/authController.js'; // <-- Import controllers

const router = Router();

// POST /api/auth/signup
router.post('/signup', signup); // <-- Use the signup controller

// POST /api/auth/login
router.post('/login', login); // <-- Use the login controller

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;