import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "../authContext/authContext";
import request from "../../../utils/request";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // chatId -> Set of typing users
  const socketRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Socket server URL
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  // Initialize socket connection with rate limiting protection
  useEffect(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      return;
    }

    if (isAuthenticated && user && !socketRef.current) {
      const token = request.utils.getAccessToken();

      if (!token) return;

      // Add a small delay to prevent immediate connection after login
      // This helps avoid rate limiting when multiple requests happen simultaneously
      connectionTimeoutRef.current = setTimeout(() => {
        if (isConnectingRef.current) return;
        
        isConnectingRef.current = true;
        console.log("Connecting to socket server...");

        const newSocket = io(SOCKET_URL, {
          auth: {
            token: token,
          },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 3, // Reduced from 5 to prevent too many retry attempts
          reconnectionDelay: 2000, // Increased delay between reconnection attempts
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: 3,
          timeout: 10000, // Add connection timeout
        });

        // Connection event handlers
        newSocket.on("connect", () => {
          console.log("Connected to socket server");
          setIsConnected(true);
          isConnectingRef.current = false;
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Disconnected from socket server:", reason);
          setIsConnected(false);
          isConnectingRef.current = false;
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
          isConnectingRef.current = false;
          
          // If connection fails due to rate limiting, increase delay for next attempt
          if (error.message?.includes('429') || error.message?.includes('rate limit')) {
            console.log("Rate limited - delaying reconnection");
            newSocket.io.opts.reconnectionDelay = Math.min(
              newSocket.io.opts.reconnectionDelay * 2, 
              30000
            );
          }
        });

        // User status events
        newSocket.on("userOnline", (data) => {
          setOnlineUsers((prev) => new Set([...prev, data.userId]));
        });

        newSocket.on("userOffline", (data) => {
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        });

        // Typing events
        newSocket.on("userTyping", (data) => {
          const { chatId, userId, username, isTyping } = data;

          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            const chatTypingUsers = newMap.get(chatId) || new Set();

            if (isTyping) {
              chatTypingUsers.add({ userId, username });
            } else {
              chatTypingUsers.delete({ userId, username });
            }

            if (chatTypingUsers.size === 0) {
              newMap.delete(chatId);
            } else {
              newMap.set(chatId, chatTypingUsers);
            }

            return newMap;
          });
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      }, 1000); // 1 second delay to prevent immediate connection after login
    }

    // Cleanup on unmount or user change
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
      if (socketRef.current) {
        console.log("Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
        isConnectingRef.current = false;
      }
    };
  }, [isAuthenticated, user?.id, SOCKET_URL]); // Use user.id instead of user object to prevent unnecessary reconnections

  // Socket event handlers with error protection
  const joinChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit("joinChat", chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit("leaveChat", chatId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit("sendMessage", messageData);
    }
  };

  const sendTyping = (chatId, isTyping) => {
    if (socket && isConnected) {
      socket.emit("typing", { chatId, isTyping });
    }
  };

  const markAsRead = (messageId, chatId) => {
    if (socket && isConnected) {
      socket.emit("markAsRead", { messageId, chatId });
    }
  };

  const editMessage = (messageId, newContent) => {
    if (socket && isConnected) {
      socket.emit("editMessage", { messageId, newContent });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && isConnected) {
      socket.emit("deleteMessage", { messageId });
    }
  };

  const updateStatus = (status) => {
    if (socket && isConnected) {
      socket.emit("updateStatus", { status });
    }
  };

  // Event listeners management
  const addEventListener = (event, handler) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  };

  const removeEventListener = (event, handler) => {
    if (socket) {
      socket.off(event, handler);
    }
  };

  // Utility functions
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const getChatTypingUsers = (chatId) => {
    return Array.from(typingUsers.get(chatId) || []);
  };

  const getTypingUsersText = (chatId, currentUserId) => {
    const users = getChatTypingUsers(chatId).filter(
      (user) => user.userId !== currentUserId
    );

    if (users.length === 0) return "";
    if (users.length === 1) return `${users[0].username} is typing...`;
    if (users.length === 2)
      return `${users[0].username} and ${users[1].username} are typing...`;
    return `${users[0].username} and ${users.length - 1} others are typing...`;
  };

  // Context value
  const value = {
    // Socket instance and connection state
    socket,
    isConnected,

    // User status
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,

    // Typing indicators
    typingUsers,
    getChatTypingUsers,
    getTypingUsersText,

    // Socket actions
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    markAsRead,
    editMessage,
    deleteMessage,
    updateStatus,

    // Event management
    addEventListener,
    removeEventListener,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
};

export default SocketContext;