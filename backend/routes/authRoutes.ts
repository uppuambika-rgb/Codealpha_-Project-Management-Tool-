import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, generateSalt } from '../db.ts';
import { generateToken, authenticate, type AuthenticatedRequest } from '../auth.ts';
import type { User } from '../types.ts';

const router = Router();

// Register new user
router.post('/register', (req, res: Response) => {
  try {
    const { name, email, password, department, title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `user_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Pick avatar color based on name
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=10b981,059669,047857`;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      avatarUrl,
      department: department?.trim() || 'General',
      title: title?.trim() || 'Team Member',
      createdAt: new Date().toISOString(),
    };

    const safeUser = db.createUser(newUser);
    const token = generateToken(safeUser.id);

    return res.status(201).json({
      user: safeUser,
      token,
      message: 'Account created successfully',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    const { passwordHash, salt, ...safeUser } = user;

    return res.json({
      user: safeUser,
      token,
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current user profile
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Logout endpoint (for client-side token discard acknowledgment)
router.post('/logout', (req, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

// List all safe users (for project member search and task assignment)
router.get('/users', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getSafeUsers();
  return res.json({ users });
});

// Fast switch user for College Demo
router.post('/demo-switch', (req, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const token = generateToken(user.id);
  const { passwordHash, salt, ...safeUser } = user;
  return res.json({
    user: safeUser,
    token,
    message: `Switched active user to ${user.name}`,
  });
});

export default router;
