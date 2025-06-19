import User from '../models/user.model.js';
import {
  generateTokenPair,
  setTokenCookies,
  clearTokenCookies,
  refreshAccessToken,
  extractRefreshTokenFromRequest,
} from '../utils/jwt.utils.js';
import validator from 'validator';

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required',
      });
    }

    // Additional validation
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be between 3 and 20 characters',
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username can only contain letters, numbers, and underscores',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({
        status: 'error',
        message: `User with this ${field} already exists`,
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(newUser._id);

    // Save refresh token to user
    await newUser.addRefreshToken(refreshToken);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Send response (exclude password and refresh tokens)
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      fullName: newUser.fullName,
      avatar: newUser.avatar,
      bio: newUser.bio,
      isOnline: newUser.isOnline,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse,
        accessToken,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email/username and password are required',
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
      isActive: true,
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Send response
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
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login',
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = extractRefreshTokenFromRequest(req);

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token required',
      });
    }

    const result = await refreshAccessToken(refreshToken);

    // Set new access token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    };

    res.cookie('accessToken', result.accessToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    // Clear cookies on refresh failure
    clearTokenCookies(res);
    
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired refresh token',
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const refreshToken = extractRefreshTokenFromRequest(req);
    const userId = req.user?.id;

    // Remove refresh token from user's token list
    if (userId && refreshToken) {
      const user = await User.findById(userId);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookies even on error
    clearTokenCookies(res);
    
    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  }
};

// Logout from all devices
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        await user.removeAllRefreshTokens();
      }
    }

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
      status: 'success',
      message: 'Logged out from all devices',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    
    // Clear cookies even on error
    clearTokenCookies(res);
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out from all devices',
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

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
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user information',
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Remove all refresh tokens (logout from all devices)
    await user.removeAllRefreshTokens();

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    });
  }
};

// Verify token (for protected routes testing)
export const verifyToken = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Token is valid',
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
      },
    },
  });
};

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword,
  verifyToken,
};