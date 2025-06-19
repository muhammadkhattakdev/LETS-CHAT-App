import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Include cookies for JWT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

// Function to get access token from localStorage or memory
const getAccessToken = () => {
  if (accessToken) return accessToken;
  
  // Try to get from localStorage as fallback
  const stored = localStorage.getItem('accessToken');
  if (stored) {
    accessToken = stored;
    return accessToken;
  }
  
  return null;
};

// Function to set access token
const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// Function to clear all auth data
const clearAuthData = () => {
  accessToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to refresh token
const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    
    const { accessToken: newToken } = response.data.data;
    setAccessToken(newToken);
    
    return newToken;
  } catch (error) {
    // Refresh failed, redirect to login
    clearAuthData();
    window.location.href = '/login';
    throw error;
  }
};

// Add subscribers to refresh queue
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Process refresh queue
const processRefreshQueue = (error, token = null) => {
  refreshSubscribers.forEach((callback) => callback(error, token));
  refreshSubscribers = [];
};

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((err, token) => {
            if (err) {
              reject(err);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processRefreshQueue(null, newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processRefreshQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Generic request handler
const handleRequest = async (requestFn, showErrorToast = true) => {
  try {
    const response = await requestFn();
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'An unexpected error occurred';

    if (showErrorToast && error.response?.status !== 401) {
      toast.error(errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
};

// Auth API calls
export const authAPI = {
  // Register new user
  register: async (userData) => {
    return handleRequest(() => api.post('/auth/register', userData));
  },

  // Login user
  login: async (credentials) => {
    const result = await handleRequest(() => api.post('/auth/login', credentials));
    
    if (result.success && result.data?.data?.accessToken) {
      setAccessToken(result.data.data.accessToken);
      // Store user data
      if (result.data.data.user) {
        localStorage.setItem('user', JSON.stringify(result.data.data.user));
      }
    }
    
    return result;
  },

  // Logout user
  logout: async () => {
    const result = await handleRequest(() => api.post('/auth/logout'), false);
    clearAuthData();
    return result;
  },

  // Logout from all devices
  logoutAll: async () => {
    const result = await handleRequest(() => api.post('/auth/logout-all'), false);
    clearAuthData();
    return result;
  },

  // Get current user
  getCurrentUser: async () => {
    return handleRequest(() => api.get('/auth/me'), false);
  },

  // Change password
  changePassword: async (passwordData) => {
    return handleRequest(() => api.put('/auth/change-password', passwordData));
  },

  // Verify token
  verifyToken: async () => {
    return handleRequest(() => api.get('/auth/verify'), false);
  },
};

// User API calls
export const userAPI = {
  // Get user profile
  getUserProfile: async (userId) => {
    return handleRequest(() => api.get(`/users/profile/${userId}`));
  },

  // Update profile
  updateProfile: async (profileData) => {
    return handleRequest(() => api.put('/users/profile', profileData));
  },

  // Search users
  searchUsers: async (query, page = 1, limit = 20) => {
    return handleRequest(() => api.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`));
  },

  // Get online users
  getOnlineUsers: async () => {
    return handleRequest(() => api.get('/users/online'));
  },

  // Friend management
  addFriend: async (friendId) => {
    return handleRequest(() => api.post(`/users/friends/${friendId}`));
  },

  removeFriend: async (friendId) => {
    return handleRequest(() => api.delete(`/users/friends/${friendId}`));
  },

  getFriends: async (page = 1, limit = 20) => {
    return handleRequest(() => api.get(`/users/friends?page=${page}&limit=${limit}`));
  },

  // Block management
  blockUser: async (userId) => {
    return handleRequest(() => api.post(`/users/block/${userId}`));
  },

  unblockUser: async (userId) => {
    return handleRequest(() => api.delete(`/users/block/${userId}`));
  },

  getBlockedUsers: async () => {
    return handleRequest(() => api.get('/users/blocked'));
  },
};

// Chat API calls
export const chatAPI = {
  // Get user's chats
  getUserChats: async (page = 1, limit = 20) => {
    return handleRequest(() => api.get(`/chats?page=${page}&limit=${limit}`));
  },

  // Create private chat
  createPrivateChat: async (participantId) => {
    return handleRequest(() => api.post('/chats/private', { participantId }));
  },

  // Create group chat
  createGroupChat: async (chatData) => {
    return handleRequest(() => api.post('/chats/group', chatData));
  },

  // Get chat details
  getChatDetails: async (chatId) => {
    return handleRequest(() => api.get(`/chats/${chatId}`));
  },

  // Update group chat
  updateGroupChat: async (chatId, updateData) => {
    return handleRequest(() => api.put(`/chats/${chatId}`, updateData));
  },

  // Add participant to group
  addParticipant: async (chatId, participantId) => {
    return handleRequest(() => api.post(`/chats/${chatId}/participants`, { participantId }));
  },

  // Remove participant from group
  removeParticipant: async (chatId, participantId) => {
    return handleRequest(() => api.delete(`/chats/${chatId}/participants`, { data: { participantId } }));
  },

  // Toggle mute chat
  toggleMuteChat: async (chatId) => {
    return handleRequest(() => api.patch(`/chats/${chatId}/mute`));
  },

  // Toggle pin chat
  togglePinChat: async (chatId) => {
    return handleRequest(() => api.patch(`/chats/${chatId}/pin`));
  },
};

// Message API calls
export const messageAPI = {
  // Get chat messages
  getChatMessages: async (chatId, page = 1, limit = 50) => {
    return handleRequest(() => api.get(`/messages/chat/${chatId}?page=${page}&limit=${limit}`));
  },

  // Send message
  sendMessage: async (chatId, messageData) => {
    return handleRequest(() => api.post(`/messages/chat/${chatId}`, messageData));
  },

  // Get message details
  getMessageDetails: async (messageId) => {
    return handleRequest(() => api.get(`/messages/${messageId}`));
  },

  // Edit message
  editMessage: async (messageId, content) => {
    return handleRequest(() => api.put(`/messages/${messageId}`, { content }));
  },

  // Delete message
  deleteMessage: async (messageId) => {
    return handleRequest(() => api.delete(`/messages/${messageId}`));
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    return handleRequest(() => api.patch(`/messages/${messageId}/read`), false);
  },

  // Mark all messages as read
  markAllMessagesAsRead: async (chatId) => {
    return handleRequest(() => api.patch(`/messages/chat/${chatId}/read-all`), false);
  },

  // Get unread count
  getUnreadCount: async (chatId) => {
    return handleRequest(() => api.get(`/messages/chat/${chatId}/unread-count`), false);
  },

  // Search messages
  searchMessages: async (chatId, query, page = 1, limit = 20) => {
    return handleRequest(() => api.get(`/messages/chat/${chatId}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`));
  },
};

// File upload API calls
export const fileAPI = {
  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return handleRequest(() => api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
  },

  // Upload message attachments
  uploadAttachments: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('attachments', file);
    });
    
    return handleRequest(() => api.post('/messages/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
  },
};

// Utility functions
export const requestUtils = {
  // Set access token (for use after login)
  setAccessToken,
  
  // Get access token
  getAccessToken,
  
  // Clear auth data
  clearAuthData,
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAccessToken();
  },
  
  // Get stored user data
  getStoredUser: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
  
  // Update stored user data
  updateStoredUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },
  
  // Generic API call
  makeRequest: async (method, url, data = null, config = {}) => {
    return handleRequest(() => api({
      method,
      url,
      data,
      ...config,
    }));
  },
};

// Export the axios instance for custom requests
export { api };

// Default export with all APIs
const request = {
  auth: authAPI,
  user: userAPI,
  chat: chatAPI,
  message: messageAPI,
  file: fileAPI,
  utils: requestUtils,
};

export default request;