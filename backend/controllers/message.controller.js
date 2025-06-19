import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import { emitToChat } from '../utils/socket.js';

// Get messages for a chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 messages per page

    const messages = await Message.getChatMessages(chatId, pageNum, limitNum);

    // Reverse to get chronological order (oldest first)
    const chronologicalMessages = messages.reverse();

    res.status(200).json({
      status: 'success',
      data: {
        messages: chronologicalMessages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          hasNext: messages.length === limitNum,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get messages',
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text', attachments = [], replyTo } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content or attachments required',
      });
    }

    if (content && content.length > 1000) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content must be less than 1000 characters',
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    // Validate reply message if provided
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (!replyMessage || replyMessage.chat.toString() !== chatId) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid reply message',
        });
      }
    }

    // Create new message
    const message = new Message({
      sender: userId,
      chat: chatId,
      content: content?.trim(),
      messageType,
      attachments,
      replyTo,
    });

    await message.save();

    // Populate sender and reply information
    await message.populate([
      { path: 'sender', select: 'username firstName lastName avatar' },
      { 
        path: 'replyTo', 
        select: 'content sender createdAt messageType',
        populate: { path: 'sender', select: 'username firstName lastName' }
      }
    ]);

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    await chat.updateLastActivity();

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: {
        message: message.toJSON(),
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
    });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content is required',
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content must be less than 1000 characters',
      });
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only edit your own messages',
      });
    }

    // Check if message is too old to edit (24 hours)
    const hoursSinceCreated = (Date.now() - message.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreated > 24) {
      return res.status(400).json({
        status: 'error',
        message: 'Messages can only be edited within 24 hours',
      });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Populate sender information
    await message.populate('sender', 'username firstName lastName avatar');

    res.status(200).json({
      status: 'success',
      message: 'Message edited successfully',
      data: {
        message: message.toJSON(),
      },
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to edit message',
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Find message
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    // Check if user is the sender or admin of group chat
    const chat = await Chat.findById(message.chat);
    const isOwner = message.sender.toString() === userId;
    const isGroupAdmin = chat.chatType === 'group' && chat.admin.toString() === userId;

    if (!isOwner && !isGroupAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own messages',
      });
    }

    // Soft delete message
    await message.softDelete(userId);

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message',
    });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    // Don't mark own messages as read
    if (message.sender.toString() === userId) {
      return res.status(200).json({
        status: 'success',
        message: 'Cannot mark own message as read',
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    await message.markAsRead(userId);

    res.status(200).json({
      status: 'success',
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark message as read',
    });
  }
};

// Mark all messages in chat as read
export const markAllMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    await Message.markAllAsRead(chatId, userId);

    res.status(200).json({
      status: 'success',
      message: 'All messages marked as read',
    });
  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read',
    });
  }
};

// Get unread message count for a chat
export const getUnreadCount = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    const unreadCount = await Message.getUnreadCount(userId, chatId);

    res.status(200).json({
      status: 'success',
      data: {
        chatId,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count',
    });
  }
};

// Get message details
export const getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId)
      .populate('sender', 'username firstName lastName avatar')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username firstName lastName'
        }
      })
      .populate('readBy.user', 'username firstName lastName avatar');

    if (!message || message.isDeleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: message.toJSON(),
      },
    });
  } catch (error) {
    console.error('Get message details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get message details',
    });
  }
};

// Search messages in a chat
export const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: searchTerm, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search term must be at least 2 characters',
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = new RegExp(searchTerm.trim(), 'i');

    const messages = await Message.find({
      chat: chatId,
      content: searchRegex,
      isDeleted: false,
    })
      .populate('sender', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean();

    const totalMessages = await Message.countDocuments({
      chat: chatId,
      content: searchRegex,
      isDeleted: false,
    });

    res.status(200).json({
      status: 'success',
      data: {
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limitNum),
          hasNext: skip + limitNum < totalMessages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search messages',
    });
  }
};

export default {
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadCount,
  getMessageDetails,
  searchMessages,
};