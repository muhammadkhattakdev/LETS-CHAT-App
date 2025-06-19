import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword,
  verifyToken,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../utils/jwt.utils.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (invalidate all refresh tokens)
 * @access  Private
 */
router.post('/logout-all', authenticateToken, logoutAll);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, changePassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token (for testing protected routes)
 * @access  Private
 */
router.get('/verify', authenticateToken, verifyToken);

export default router;