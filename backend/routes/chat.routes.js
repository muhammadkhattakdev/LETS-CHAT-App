import express from 'express';
import {
  getUserChats,
  createPrivateChat,
  createGroupChat,
  getChatDetails,
  updateGroupChat,
  addParticipant,
  removeParticipant,
  toggleMuteChat,
  togglePinChat,
} from '../controllers/chat.controller.js';
import { authenticateToken } from '../utils/jwt.utils.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/chats
 * @desc    Get user's chats
 * @access  Private
 * @query   page, limit
 */
router.get('/', getUserChats);

/**
 * @route   POST /api/chats/private
 * @desc    Create or get private chat
 * @access  Private
 */
router.post('/private', createPrivateChat);

/**
 * @route   POST /api/chats/group
 * @desc    Create group chat
 * @access  Private
 */
router.post('/group', createGroupChat);

/**
 * @route   GET /api/chats/:chatId
 * @desc    Get chat details
 * @access  Private
 */
router.get('/:chatId', getChatDetails);

/**
 * @route   PUT /api/chats/:chatId
 * @desc    Update group chat (name, description, avatar)
 * @access  Private
 */
router.put('/:chatId', updateGroupChat);

/**
 * @route   POST /api/chats/:chatId/participants
 * @desc    Add participant to group chat
 * @access  Private
 */
router.post('/:chatId/participants', addParticipant);

/**
 * @route   DELETE /api/chats/:chatId/participants
 * @desc    Remove participant from group chat
 * @access  Private
 */
router.delete('/:chatId/participants', removeParticipant);

/**
 * @route   PATCH /api/chats/:chatId/mute
 * @desc    Mute/unmute chat for current user
 * @access  Private
 */
router.patch('/:chatId/mute', toggleMuteChat);

/**
 * @route   PATCH /api/chats/:chatId/pin
 * @desc    Pin/unpin chat for current user
 * @access  Private
 */
router.patch('/:chatId/pin', togglePinChat);

export default router;