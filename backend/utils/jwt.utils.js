import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Generate access token
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Generate token pair
export const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};

// Set token cookies
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Clear token cookies
export const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

// Refresh access token
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if refresh token exists in user's refresh tokens
    const tokenExists = user.refreshTokens.some(
      (tokenObj) => tokenObj.token === refreshToken
    );

    if (!tokenExists) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);
    
    return {
      accessToken: newAccessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isOnline: user.isOnline,
      },
    };
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
};

// Extract token from request
export const extractTokenFromRequest = (req) => {
  let token = null;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }
  // Check cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  return token;
};

// Extract refresh token from request
export const extractRefreshTokenFromRequest = (req) => {
  let refreshToken = null;

  // Check cookies first
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }
  // Check body
  else if (req.body && req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  return refreshToken;
};

// Middleware to authenticate user
export const authenticateToken = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required',
      });
    }

    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};

// Middleware to optionally authenticate user
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
    });
  }
  next();
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  setTokenCookies,
  clearTokenCookies,
  refreshAccessToken,
  extractTokenFromRequest,
  extractRefreshTokenFromRequest,
  authenticateToken,
  optionalAuth,
  requireAdmin,
};