import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    chatType: {
      type: String,
      enum: ['private', 'group'],
      default: 'private',
    },
    chatName: {
      type: String,
      trim: true,
      maxlength: [100, 'Chat name must be less than 100 characters'],
      required: function() {
        return this.chatType === 'group';
      },
    },
    chatAvatar: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      maxlength: [500, 'Description must be less than 500 characters'],
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.chatType === 'group';
      },
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Group-specific fields
    groupSettings: {
      allowMembersToAddOthers: {
        type: Boolean,
        default: false,
      },
      allowMembersToEditGroupInfo: {
        type: Boolean,
        default: false,
      },
      messageRetentionDays: {
        type: Number,
        default: 0, // 0 means forever
      },
    },
    // Private chat specific fields
    mutedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      mutedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    pinnedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ chatType: 1 });

// Ensure private chats have exactly 2 participants
chatSchema.pre('save', function (next) {
  if (this.chatType === 'private' && this.participants.length !== 2) {
    return next(new Error('Private chats must have exactly 2 participants'));
  }
  
  if (this.chatType === 'group' && this.participants.length < 2) {
    return next(new Error('Group chats must have at least 2 participants'));
  }
  
  next();
});

// Virtual for participant count
chatSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

// Instance method to add participant (group chats only)
chatSchema.methods.addParticipant = function (userId) {
  if (this.chatType !== 'group') {
    throw new Error('Can only add participants to group chats');
  }
  
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    this.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to remove participant (group chats only)
chatSchema.methods.removeParticipant = function (userId) {
  if (this.chatType !== 'group') {
    throw new Error('Can only remove participants from group chats');
  }
  
  this.participants = this.participants.filter(
    (participant) => participant.toString() !== userId.toString()
  );
  
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to update last activity
chatSchema.methods.updateLastActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to mute chat for user
chatSchema.methods.muteForUser = function (userId) {
  const alreadyMuted = this.mutedBy.some(
    (mute) => mute.user.toString() === userId.toString()
  );
  
  if (!alreadyMuted) {
    this.mutedBy.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to unmute chat for user
chatSchema.methods.unmuteForUser = function (userId) {
  this.mutedBy = this.mutedBy.filter(
    (mute) => mute.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method to pin chat for user
chatSchema.methods.pinForUser = function (userId) {
  if (!this.pinnedBy.includes(userId)) {
    this.pinnedBy.push(userId);
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to unpin chat for user
chatSchema.methods.unpinForUser = function (userId) {
  this.pinnedBy = this.pinnedBy.filter(
    (pinnedUser) => pinnedUser.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to find private chat between two users
chatSchema.statics.findPrivateChat = function (user1Id, user2Id) {
  return this.findOne({
    chatType: 'private',
    participants: { $all: [user1Id, user2Id] },
    isActive: true,
  });
};

// Static method to get user's chats
chatSchema.statics.getUserChats = function (userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: userId,
    isActive: true,
  })
    .populate('participants', 'username firstName lastName avatar isOnline lastSeen')
    .populate('admin', 'username firstName lastName')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username firstName lastName'
      }
    })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to search chats
chatSchema.statics.searchChats = function (userId, searchTerm) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    participants: userId,
    isActive: true,
    $or: [
      { chatName: searchRegex },
      { description: searchRegex },
    ],
  })
    .populate('participants', 'username firstName lastName avatar')
    .populate('lastMessage')
    .sort({ lastActivity: -1 })
    .lean();
};

// Static method to create private chat
chatSchema.statics.createPrivateChat = async function (user1Id, user2Id) {
  // Check if chat already exists
  const existingChat = await this.findPrivateChat(user1Id, user2Id);
  if (existingChat) {
    return existingChat;
  }
  
  // Create new private chat
  const newChat = new this({
    participants: [user1Id, user2Id],
    chatType: 'private',
  });
  
  return newChat.save();
};

// Static method to create group chat
chatSchema.statics.createGroupChat = function (adminId, participants, chatName, description = '') {
  // Add admin to participants if not already included
  if (!participants.includes(adminId)) {
    participants.push(adminId);
  }
  
  const newChat = new this({
    participants,
    chatType: 'group',
    chatName,
    description,
    admin: adminId,
  });
  
  return newChat.save();
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;