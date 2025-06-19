import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';

// Get user's chats
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.getUserChats(userId, parseInt(page), parseInt(limit));

    // Process chats to include additional information
    const processedChats = await Promise.all(
      chats.map(async (chat) => {
        let chatData = {
          id: chat._id,
          chatType: chat.chatType,
          lastActivity: chat.lastActivity,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        };

        if (chat.chatType === 'private') {
          // For private chats, find the other participant
          const otherParticipant = chat.participants.find(
            (participant) => participant._id.toString() !== userId
          );

          if (otherParticipant) {
            chatData = {
              ...chatData,
              name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
              avatar: otherParticipant.avatar,
              isOnline: otherParticipant.isOnline,
              lastSeen: otherParticipant.lastSeen,
              username: otherParticipant.username,
              participants: [otherParticipant],
            };
          }
        } else {
          // For group chats
          chatData = {
            ...chatData,
            name: chat.chatName,
            avatar: chat.chatAvatar,
            description: chat.description,
            admin: chat.admin,
            participants: chat.participants,
            participantCount: chat.participants.length,
            groupSettings: chat.groupSettings,
          };
        }

        // Add last message information
        if (chat.lastMessage) {
          chatData.lastMessage = {
            id: chat.lastMessage._id,
            content: chat.lastMessage.content,
            messageType: chat.lastMessage.messageType,
            sender: chat.lastMessage.sender,
            createdAt: chat.lastMessage.createdAt,
            isDeleted: chat.lastMessage.isDeleted,
          };
        }

        // Get unread message count
        const unreadCount = await Message.getUnreadCount(userId, chat._id);
        chatData.unreadCount = unreadCount;

        // Check if chat is muted or pinned by user
        const isMuted = chat.mutedBy.some(
          (mute) => mute.user.toString() === userId
        );
        const isPinned = chat.pinnedBy.includes(userId);

        chatData.isMuted = isMuted;
        chatData.isPinned = isPinned;

        return chatData;
      })
    );

    // Sort by pinned status and then by last activity
    processedChats.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    res.status(200).json({
      status: 'success',
      data: {
        chats: processedChats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasNext: chats.length === parseInt(limit),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chats',
    });
  }
};

// Create private chat
export const createPrivateChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    if (!participantId) {
      return res.status(400).json({
        status: 'error',
        message: 'Participant ID is required',
      });
    }

    if (participantId === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot create chat with yourself',
      });
    }

    // Check if participant exists and is active
    const participant = await User.findById(participantId);
    if (!participant || !participant.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if user is blocked
    if (participant.blockedUsers.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot create chat with this user',
      });
    }

    // Create or get existing private chat
    const chat = await Chat.createPrivateChat(userId, participantId);

    // Populate chat data
    await chat.populate([
      {
        path: 'participants',
        select: 'username firstName lastName avatar isOnline lastSeen',
      },
    ]);

    // Format response for private chat
    const otherParticipant = chat.participants.find(
      (p) => p._id.toString() !== userId
    );

    const chatResponse = {
      id: chat._id,
      chatType: chat.chatType,
      name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
      avatar: otherParticipant.avatar,
      isOnline: otherParticipant.isOnline,
      lastSeen: otherParticipant.lastSeen,
      username: otherParticipant.username,
      participants: [otherParticipant],
      lastActivity: chat.lastActivity,
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      createdAt: chat.createdAt,
    };

    res.status(201).json({
      status: 'success',
      message: 'Private chat created successfully',
      data: {
        chat: chatResponse,
      },
    });
  } catch (error) {
    console.error('Create private chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create private chat',
    });
  }
};

// Create group chat
export const createGroupChat = async (req, res) => {
  try {
    const { chatName, description = '', participantIds = [] } = req.body;
    const userId = req.user.id;

    // Validation
    if (!chatName || chatName.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Chat name is required',
      });
    }

    if (chatName.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Chat name must be less than 100 characters',
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        status: 'error',
        message: 'Description must be less than 500 characters',
      });
    }

    if (participantIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one participant is required',
      });
    }

    // Validate all participants exist
    const participants = await User.find({
      _id: { $in: participantIds },
      isActive: true,
    });

    if (participants.length !== participantIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more participants not found',
      });
    }

    // Create group chat
    const chat = await Chat.createGroupChat(
      userId,
      participantIds,
      chatName.trim(),
      description.trim()
    );

    // Populate chat data
    await chat.populate([
      {
        path: 'participants',
        select: 'username firstName lastName avatar isOnline lastSeen',
      },
      {
        path: 'admin',
        select: 'username firstName lastName',
      },
    ]);

    const chatResponse = {
      id: chat._id,
      chatType: chat.chatType,
      name: chat.chatName,
      avatar: chat.chatAvatar,
      description: chat.description,
      admin: chat.admin,
      participants: chat.participants,
      participantCount: chat.participants.length,
      groupSettings: chat.groupSettings,
      lastActivity: chat.lastActivity,
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      createdAt: chat.createdAt,
    };

    res.status(201).json({
      status: 'success',
      message: 'Group chat created successfully',
      data: {
        chat: chatResponse,
      },
    });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create group chat',
    });
  }
};

// Get chat details
export const getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'username firstName lastName avatar isOnline lastSeen')
      .populate('admin', 'username firstName lastName')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username firstName lastName',
        },
      });

    if (!chat || !chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    let chatResponse = {
      id: chat._id,
      chatType: chat.chatType,
      lastActivity: chat.lastActivity,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    if (chat.chatType === 'private') {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== userId
      );

      chatResponse = {
        ...chatResponse,
        name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
        avatar: otherParticipant.avatar,
        isOnline: otherParticipant.isOnline,
        lastSeen: otherParticipant.lastSeen,
        username: otherParticipant.username,
        participants: [otherParticipant],
      };
    } else {
      chatResponse = {
        ...chatResponse,
        name: chat.chatName,
        avatar: chat.chatAvatar,
        description: chat.description,
        admin: chat.admin,
        participants: chat.participants,
        participantCount: chat.participants.length,
        groupSettings: chat.groupSettings,
      };
    }

    // Add additional info
    if (chat.lastMessage) {
      chatResponse.lastMessage = chat.lastMessage;
    }

    const unreadCount = await Message.getUnreadCount(userId, chatId);
    chatResponse.unreadCount = unreadCount;

    const isMuted = chat.mutedBy.some(mute => mute.user.toString() === userId);
    const isPinned = chat.pinnedBy.includes(userId);

    chatResponse.isMuted = isMuted;
    chatResponse.isPinned = isPinned;

    res.status(200).json({
      status: 'success',
      data: {
        chat: chatResponse,
      },
    });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chat details',
    });
  }
};

// Update group chat
export const updateGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { chatName, description, chatAvatar } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat || chat.chatType !== 'group') {
      return res.status(404).json({
        status: 'error',
        message: 'Group chat not found',
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Check permissions
    const canEdit = chat.admin.toString() === userId || 
                   chat.groupSettings.allowMembersToEditGroupInfo;

    if (!canEdit) {
      return res.status(403).json({
        status: 'error',
        message: 'Permission denied to edit group info',
      });
    }

    // Update fields
    const updates = {};
    
    if (chatName !== undefined) {
      if (!chatName.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Chat name cannot be empty',
        });
      }
      if (chatName.length > 100) {
        return res.status(400).json({
          status: 'error',
          message: 'Chat name must be less than 100 characters',
        });
      }
      updates.chatName = chatName.trim();
    }

    if (description !== undefined) {
      if (description.length > 500) {
        return res.status(400).json({
          status: 'error',
          message: 'Description must be less than 500 characters',
        });
      }
      updates.description = description.trim();
    }

    if (chatAvatar !== undefined) {
      updates.chatAvatar = chatAvatar;
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      updates,
      { new: true, runValidators: true }
    ).populate('participants', 'username firstName lastName avatar')
     .populate('admin', 'username firstName lastName');

    res.status(200).json({
      status: 'success',
      message: 'Group chat updated successfully',
      data: {
        chat: updatedChat,
      },
    });
  } catch (error) {
    console.error('Update group chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update group chat',
    });
  }
};

// Add participant to group chat
export const addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { participantId } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat || chat.chatType !== 'group') {
      return res.status(404).json({
        status: 'error',
        message: 'Group chat not found',
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Check permissions
    const canAdd = chat.admin.toString() === userId || 
                  chat.groupSettings.allowMembersToAddOthers;

    if (!canAdd) {
      return res.status(403).json({
        status: 'error',
        message: 'Permission denied to add participants',
      });
    }

    // Validate participant
    const participant = await User.findById(participantId);
    if (!participant || !participant.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    if (chat.participants.includes(participantId)) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already a participant',
      });
    }

    // Add participant
    await chat.addParticipant(participantId);

    res.status(200).json({
      status: 'success',
      message: 'Participant added successfully',
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add participant',
    });
  }
};

// Remove participant from group chat
export const removeParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { participantId } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat || chat.chatType !== 'group') {
      return res.status(404).json({
        status: 'error',
        message: 'Group chat not found',
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Only admin can remove participants (or users can remove themselves)
    if (chat.admin.toString() !== userId && participantId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only admin can remove participants',
      });
    }

    if (!chat.participants.includes(participantId)) {
      return res.status(400).json({
        status: 'error',
        message: 'User is not a participant',
      });
    }

    // Cannot remove admin
    if (participantId === chat.admin.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot remove group admin',
      });
    }

    // Remove participant
    await chat.removeParticipant(participantId);

    res.status(200).json({
      status: 'success',
      message: 'Participant removed successfully',
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove participant',
    });
  }
};

// Mute/unmute chat
export const toggleMuteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    const isMuted = chat.mutedBy.some(mute => mute.user.toString() === userId);

    if (isMuted) {
      await chat.unmuteForUser(userId);
    } else {
      await chat.muteForUser(userId);
    }

    res.status(200).json({
      status: 'success',
      message: `Chat ${isMuted ? 'unmuted' : 'muted'} successfully`,
      data: {
        isMuted: !isMuted,
      },
    });
  } catch (error) {
    console.error('Toggle mute chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle mute status',
    });
  }
};

// Pin/unpin chat
export const togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found or access denied',
      });
    }

    const isPinned = chat.pinnedBy.includes(userId);

    if (isPinned) {
      await chat.unpinForUser(userId);
    } else {
      await chat.pinForUser(userId);
    }

    res.status(200).json({
      status: 'success',
      message: `Chat ${isPinned ? 'unpinned' : 'pinned'} successfully`,
      data: {
        isPinned: !isPinned,
      },
    });
  } catch (error) {
    console.error('Toggle pin chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle pin status',
    });
  }
};

export default {
  getUserChats,
  createPrivateChat,
  createGroupChat,
  getChatDetails,
  updateGroupChat,
  addParticipant,
  removeParticipant,
  toggleMuteChat,
  togglePinChat,
};