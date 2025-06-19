import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat is required'],
    },
    content: {
      type: String,
      required: function() {
        return !this.attachments || this.attachments.length === 0;
      },
      maxlength: [1000, 'Message content must be less than 1000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'file'],
      default: 'text',
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'file'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      mimeType: {
        type: String,
        required: true,
      },
      cloudinaryId: String, // For deletion from cloudinary
    }],
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    editedAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for read status
messageSchema.virtual('isRead').get(function () {
  return this.readBy && this.readBy.length > 0;
});

// Pre-save middleware
messageSchema.pre('save', function (next) {
  if (this.isModified('content') && this.createdAt) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Instance method to mark as read by user
messageSchema.methods.markAsRead = function (userId) {
  // Check if user already read this message
  const alreadyRead = this.readBy.some(
    (read) => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Static method to get messages for a chat
messageSchema.statics.getChatMessages = function (chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    chat: chatId, 
    isDeleted: false 
  })
    .populate('sender', 'username firstName lastName avatar')
    .populate('replyTo', 'content sender createdAt')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'username firstName lastName'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get unread message count for user
messageSchema.statics.getUnreadCount = function (userId, chatId) {
  return this.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    isDeleted: false,
    'readBy.user': { $ne: userId },
  });
};

// Static method to mark all messages as read in a chat
messageSchema.statics.markAllAsRead = function (chatId, userId) {
  return this.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      isDeleted: false,
      'readBy.user': { $ne: userId },
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date(),
        },
      },
    }
  );
};

// Static method to get latest message for chat
messageSchema.statics.getLatestMessage = function (chatId) {
  return this.findOne({
    chat: chatId,
    isDeleted: false,
  })
    .populate('sender', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .lean();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;