import { verifyAccessToken } from './jwt.utils.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';

let io;
const connectedUsers = new Map(); // userId -> socketId

export const initializeSocket = (socketIo) => {
  io = socketIo;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    // Update user online status
    await User.updateOnlineStatus(socket.userId, true, socket.id);
    
    // Join user to their chat rooms
    const userChats = await Chat.find({
      participants: socket.userId,
      isActive: true,
    }).select('_id');
    
    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });

    // Emit user online status to all contacts
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      username: socket.user.username,
      isOnline: true,
    });

    // Handle joining a chat room
    socket.on('joinChat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (chat && chat.participants.includes(socket.userId)) {
          socket.join(chatId);
          console.log(`User ${socket.user.username} joined chat: ${chatId}`);
        }
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

    // Handle leaving a chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.user.username} left chat: ${chatId}`);
    });

    // Handle sending a message
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content, messageType = 'text', attachments = [], replyTo } = data;

        // Validate chat and user permission
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Chat not found or access denied' });
          return;
        }

        // Create new message
        const message = new Message({
          sender: socket.userId,
          chat: chatId,
          content,
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
            select: 'content sender createdAt',
            populate: { path: 'sender', select: 'username firstName lastName' }
          }
        ]);

        // Update chat's last message and activity
        chat.lastMessage = message._id;
        await chat.updateLastActivity();

        // Emit message to all participants in the chat
        io.to(chatId).emit('newMessage', {
          message: message.toJSON(),
          chatId,
        });

        // Send push notification to offline users (implement based on your notification service)
        const offlineParticipants = await User.find({
          _id: { $in: chat.participants },
          isOnline: false,
          _id: { $ne: socket.userId },
        });

        // Emit unread count update
        for (const participant of chat.participants) {
          if (participant.toString() !== socket.userId) {
            const unreadCount = await Message.getUnreadCount(participant, chatId);
            const participantSocketId = connectedUsers.get(participant.toString());
            
            if (participantSocketId) {
              io.to(participantSocketId).emit('unreadCountUpdate', {
                chatId,
                unreadCount,
              });
            }
          }
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing events
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(chatId).emit('userTyping', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping,
      });
    });

    // Handle message read events
    socket.on('markAsRead', async (data) => {
      try {
        const { messageId, chatId } = data;

        if (messageId) {
          // Mark specific message as read
          const message = await Message.findById(messageId);
          if (message && message.sender.toString() !== socket.userId) {
            await message.markAsRead(socket.userId);
            
            // Notify sender that message was read
            const senderSocketId = connectedUsers.get(message.sender.toString());
            if (senderSocketId) {
              io.to(senderSocketId).emit('messageRead', {
                messageId,
                readBy: socket.userId,
                readAt: new Date(),
              });
            }
          }
        } else if (chatId) {
          // Mark all messages in chat as read
          await Message.markAllAsRead(chatId, socket.userId);
          
          // Emit updated unread count
          socket.emit('unreadCountUpdate', {
            chatId,
            unreadCount: 0,
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle message editing
    socket.on('editMessage', async (data) => {
      try {
        const { messageId, newContent } = data;

        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Message not found or not authorized' });
          return;
        }

        message.content = newContent;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        // Emit updated message to all participants
        io.to(message.chat.toString()).emit('messageEdited', {
          messageId,
          newContent,
          editedAt: message.editedAt,
        });

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('deleteMessage', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Message not found or not authorized' });
          return;
        }

        await message.softDelete(socket.userId);

        // Emit message deletion to all participants
        io.to(message.chat.toString()).emit('messageDeleted', {
          messageId,
          deletedBy: socket.userId,
          deletedAt: message.deletedAt,
        });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle user status updates
    socket.on('updateStatus', async (data) => {
      try {
        const { status } = data; // 'online', 'away', 'busy', 'offline'
        
        // Update user status in database if needed
        // For now, just broadcast the status change
        socket.broadcast.emit('userStatusUpdate', {
          userId: socket.userId,
          status,
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Remove user from connected users
      connectedUsers.delete(socket.userId);
      
      // Update user offline status
      await User.updateOnlineStatus(socket.userId, false);
      
      // Emit user offline status to all contacts
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        username: socket.user.username,
        isOnline: false,
        lastSeen: new Date(),
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.io initialized');
};

// Utility functions
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

export const getSocketId = (userId) => {
  return connectedUsers.get(userId);
};

export const emitToUser = (userId, event, data) => {
  const socketId = connectedUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

export const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
  }
};

export const getIO = () => io;

export default {
  initializeSocket,
  getConnectedUsers,
  getSocketId,
  emitToUser,
  emitToChat,
  getIO,
};