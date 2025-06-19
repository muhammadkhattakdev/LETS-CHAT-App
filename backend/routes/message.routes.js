import express from 'express';
import {
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadCount,
  getMessageDetails,
  searchMessages,
} from '../controllers/message.controller.js';
import { authenticateToken } from '../utils/jwt.utils.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/messages/chat/:chatId
 * @desc    Get messages for a chat
 * @access  Private
 * @query   page, limit
 */
router.get('/chat/:chatId', getChatMessages);

/**
 * @route   POST /api/messages/chat/:chatId
 * @desc    Send a message to a chat
 * @access  Private
 */
router.post('/chat/:chatId', sendMessage);

/**
 * @route   GET /api/messages/:messageId
 * @desc    Get message details
 * @access  Private
 */
router.get('/:messageId', getMessageDetails);

/**
 * @route   PUT /api/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:messageId', editMessage);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', deleteMessage);

/**
 * @route   PATCH /api/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.patch('/:messageId/read', markMessageAsRead);

/**
 * @route   PATCH /api/messages/chat/:chatId/read-all
 * @desc    Mark all messages in chat as read
 * @access  Private
 */
router.patch('/chat/:chatId/read-all', markAllMessagesAsRead);

/**
 * @route   GET /api/messages/chat/:chatId/unread-count
 * @desc    Get unread message count for a chat
 * @access  Private
 */
router.get('/chat/:chatId/unread-count', getUnreadCount);

/**
 * @route   GET /api/messages/chat/:chatId/search
 * @desc    Search messages in a chat
 * @access  Private
 * @query   q (search term), page, limit
 */
router.get('/chat/:chatId/search', searchMessages);

export default router;