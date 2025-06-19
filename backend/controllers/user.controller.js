import User from '../models/user.model.js';
import validator from 'validator';

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-refreshTokens -blockedUsers');
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      status: 'success',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile',
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio, avatar } = req.body;

    // Validation
    const updates = {};
    
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'First name cannot be empty',
        });
      }
      if (firstName.length > 50) {
        return res.status(400).json({
          status: 'error',
          message: 'First name must be less than 50 characters',
        });
      }
      updates.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Last name cannot be empty',
        });
      }
      if (lastName.length > 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Last name must be less than 50 characters',
        });
      }
      updates.lastName = lastName.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 500) {
        return res.status(400).json({
          status: 'error',
          message: 'Bio must be less than 500 characters',
        });
      }
      updates.bio = bio.trim();
    }

    if (avatar !== undefined) {
      // Validate avatar URL if provided
      if (avatar && !validator.isURL(avatar)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid avatar URL',
        });
      }
      updates.avatar = avatar;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -blockedUsers');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search term must be at least 2 characters',
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 results per page

    const users = await User.searchUsers(searchTerm.trim(), userId);
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = users.slice(startIndex, endIndex);

    const userResults = paginatedUsers.map(user => ({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        users: userResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: users.length,
          totalPages: Math.ceil(users.length / limitNum),
          hasNext: endIndex < users.length,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search users',
    });
  }
};

// Get online users
export const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.getOnlineUsers();
    
    const userResults = users.map(user => ({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatar: user.avatar,
      socketId: user.socketId,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        users: userResults,
        count: userResults.length,
      },
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get online users',
    });
  }
};

// Add friend
export const addFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    if (friendId === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot add yourself as friend',
      });
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend || !friend.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if already friends
    const user = await User.findById(userId);
    if (user.friends.includes(friendId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Already friends with this user',
      });
    }

    // Add friend to both users
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $addToSet: { friends: userId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Friend added successfully',
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add friend',
    });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // Remove friend from both users
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Friend removed successfully',
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove friend',
    });
  }
};

// Get user's friends
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(userId)
      .populate({
        path: 'friends',
        select: 'username firstName lastName avatar isOnline lastSeen',
        options: {
          limit: limitNum,
          skip: skip,
          sort: { isOnline: -1, username: 1 }, // Online friends first
        },
      });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const friendResults = user.friends.map(friend => ({
      id: friend._id,
      username: friend.username,
      firstName: friend.firstName,
      lastName: friend.lastName,
      fullName: friend.fullName,
      avatar: friend.avatar,
      isOnline: friend.isOnline,
      lastSeen: friend.lastSeen,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        friends: friendResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          hasNext: user.friends.length === limitNum,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get friends',
    });
  }
};

// Block user
export const blockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.params;
    const userId = req.user.id;

    if (userIdToBlock === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot block yourself',
      });
    }

    // Check if user exists
    const userToBlock = await User.findById(userIdToBlock);
    if (!userToBlock || !userToBlock.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Add to blocked users list
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: userIdToBlock },
      $pull: { friends: userIdToBlock }, // Remove from friends if exists
    });

    // Remove from friend's list as well
    await User.findByIdAndUpdate(userIdToBlock, {
      $pull: { friends: userId },
    });

    res.status(200).json({
      status: 'success',
      message: 'User blocked successfully',
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to block user',
    });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const { userIdToUnblock } = req.params;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: userIdToUnblock },
    });

    res.status(200).json({
      status: 'success',
      message: 'User unblocked successfully',
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unblock user',
    });
  }
};

// Get blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('blockedUsers', 'username firstName lastName avatar');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const blockedUsers = user.blockedUsers.map(blockedUser => ({
      id: blockedUser._id,
      username: blockedUser.username,
      firstName: blockedUser.firstName,
      lastName: blockedUser.lastName,
      fullName: blockedUser.fullName,
      avatar: blockedUser.avatar,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        blockedUsers,
        count: blockedUsers.length,
      },
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blocked users',
    });
  }
};

export default {
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
};