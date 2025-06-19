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

  // Socket server URL
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user && !socketRef.current) {
      const token = request.utils.getAccessToken();

      if (!token) return;

      console.log("Connecting to socket server...");

      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Connection event handlers
      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        setIsConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from socket server:", reason);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
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
    }

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      }
    };
  }, [isAuthenticated, user, SOCKET_URL]);

  // Socket event handlers
  const joinChat = (chatId) => {
    if (socket) {
      socket.emit("joinChat", chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket) {
      socket.emit("leaveChat", chatId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit("sendMessage", messageData);
    }
  };

  const sendTyping = (chatId, isTyping) => {
    if (socket) {
      socket.emit("typing", { chatId, isTyping });
    }
  };

  const markAsRead = (messageId, chatId) => {
    if (socket) {
      socket.emit("markAsRead", { messageId, chatId });
    }
  };

  const editMessage = (messageId, newContent) => {
    if (socket) {
      socket.emit("editMessage", { messageId, newContent });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit("deleteMessage", { messageId });
    }
  };

  const updateStatus = (status) => {
    if (socket) {
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
