import express from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  getOnlineUsers,
  addFriend,
  removeFriend,
  getFriends,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../utils/jwt.utils.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/profile/:userId', getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 * @query   q (search term), page, limit
 */
router.get('/search', searchUsers);

/**
 * @route   GET /api/users/online
 * @desc    Get online users
 * @access  Private
 */
router.get('/online', getOnlineUsers);

/**
 * @route   POST /api/users/friends/:friendId
 * @desc    Add friend
 * @access  Private
 */
router.post('/friends/:friendId', addFriend);

/**
 * @route   DELETE /api/users/friends/:friendId
 * @desc    Remove friend
 * @access  Private
 */
router.delete('/friends/:friendId', removeFriend);

/**
 * @route   GET /api/users/friends
 * @desc    Get user's friends
 * @access  Private
 * @query   page, limit
 */
router.get('/friends', getFriends);

/**
 * @route   POST /api/users/block/:userIdToBlock
 * @desc    Block a user
 * @access  Private
 */
router.post('/block/:userIdToBlock', blockUser);

/**
 * @route   DELETE /api/users/block/:userIdToUnblock
 * @desc    Unblock a user
 * @access  Private
 */
router.delete('/block/:userIdToUnblock', unblockUser);

/**
 * @route   GET /api/users/blocked
 * @desc    Get blocked users
 * @access  Private
 */
router.get('/blocked', getBlockedUsers);

export default router;