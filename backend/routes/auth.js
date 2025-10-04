import { Router } from 'express';
import { signup, login } from '../controllers/authController.js'; // <-- Import controllers

const router = Router();

// POST /api/auth/signup
router.post('/signup', signup); // <-- Use the signup controller

// POST /api/auth/login
router.post('/login', login); // <-- Use the login controller

export default router;