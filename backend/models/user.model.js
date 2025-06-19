import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be less than 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name must be less than 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name must be less than 50 characters'],
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must be less than 500 characters'],
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: '',
    },
    refreshTokens: [{
      token: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800, // 7 days
      },
    }],
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with salt rounds of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update lastSeen
userSchema.pre('save', function (next) {
  if (this.isModified('isOnline') && this.isOnline === false) {
    this.lastSeen = new Date();
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function (token) {
  // Remove old tokens (keep only last 5)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift();
  }
  
  this.refreshTokens.push({ token });
  return this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(
    (refreshToken) => refreshToken.token !== token
  );
  return this.save();
};

// Instance method to remove all refresh tokens
userSchema.methods.removeAllRefreshTokens = function () {
  this.refreshTokens = [];
  return this.save();
};

// Static method to find users by search term
userSchema.statics.searchUsers = function (searchTerm, excludeUserId) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    $and: [
      {
        $or: [
          { username: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      },
      { _id: { $ne: excludeUserId } },
      { isActive: true },
    ],
  }).select('-refreshTokens -blockedUsers');
};

// Static method to get online users
userSchema.statics.getOnlineUsers = function () {
  return this.find({ isOnline: true }).select('username firstName lastName avatar socketId');
};

// Static method to update user online status
userSchema.statics.updateOnlineStatus = async function (userId, isOnline, socketId = '') {
  return this.findByIdAndUpdate(
    userId,
    {
      isOnline,
      socketId: isOnline ? socketId : '',
      lastSeen: isOnline ? undefined : new Date(),
    },
    { new: true }
  );
};

const User = mongoose.model('User', userSchema);

export default User;