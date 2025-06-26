import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import messageRoutes from './routes/message.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Import socket handlers
import { initializeSocket } from './utils/socket.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Socket.io configuration
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000, // Heartbeat interval
  transports: ['websocket', 'polling'], // Prefer websocket
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Enhanced Rate limiting with user-based limits for authenticated routes
const createUserBasedLimiter = (windowMs, maxRequests, message) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      // Higher limits for authenticated users (user-based)
      if (req.user) {
        return maxRequests * 3; // 3x higher limit for authenticated users
      }
      // Lower limits for non-authenticated requests (IP-based)
      return maxRequests;
    },
    keyGenerator: (req) => {
      // Use user ID for authenticated requests, IP for others
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    message: {
      status: 'error',
      message: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for socket.io handshake (handled separately)
    skip: (req) => req.url.startsWith('/socket.io/'),
  });
};

// General API rate limiting - more lenient
const generalLimiter = createUserBasedLimiter(
  15 * 60 * 1000, // 15 minutes
  20000000000, // 200 requests per IP, 600 per authenticated user
  'Too many requests, please try again later.'
);

// Auth rate limiting - separate limits for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100005, // Allow more auth attempts
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const socketLimiter = rateLimit({
  windowMs: 5 * 60 * 1000000000000, // 5 minutes
  max: 50000000000, // Allow many socket connections
  keyGenerator: (req) => {

    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    return token ? `socket:${token.slice(-10)}` : `socket-ip:${req.ip}`;
  },
  message: 'Too many socket connections, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/socket.io/', socketLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors,
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: 'error',
      message: `${field} already exists`,
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize Socket.io
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

export default app;