import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { useSocket } from "../socketContext/socketContext";
import { useAuth } from "../authContext/authContext";
import request from "../../../utils/request";
import toast from "react-hot-toast";

// Initial state
const initialState = {
  chats: [],
  currentChat: null,
  messages: {},
  unreadCounts: {},
  loading: false,
  error: null,
  searchResults: [],
  isSearching: false,
};

// Action types
const CHAT_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_CHATS: "SET_CHATS",
  ADD_CHAT: "ADD_CHAT",
  UPDATE_CHAT: "UPDATE_CHAT",
  REMOVE_CHAT: "REMOVE_CHAT",
  SET_CURRENT_CHAT: "SET_CURRENT_CHAT",
  SET_MESSAGES: "SET_MESSAGES",
  ADD_MESSAGE: "ADD_MESSAGE",
  UPDATE_MESSAGE: "UPDATE_MESSAGE",
  REMOVE_MESSAGE: "REMOVE_MESSAGE",
  SET_UNREAD_COUNT: "SET_UNREAD_COUNT",
  UPDATE_UNREAD_COUNT: "UPDATE_UNREAD_COUNT",
  SET_SEARCH_RESULTS: "SET_SEARCH_RESULTS",
  SET_SEARCHING: "SET_SEARCHING",
  CLEAR_SEARCH: "CLEAR_SEARCH",
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null };

    case CHAT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case CHAT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case CHAT_ACTIONS.SET_CHATS:
      return { ...state, chats: action.payload, loading: false };

    case CHAT_ACTIONS.ADD_CHAT:
      return {
        ...state,
        chats: [
          action.payload,
          ...state.chats.filter((c) => c.id !== action.payload.id),
        ],
      };

    case CHAT_ACTIONS.UPDATE_CHAT:
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.id ? { ...chat, ...action.payload } : chat
        ),
        currentChat:
          state.currentChat?.id === action.payload.id
            ? { ...state.currentChat, ...action.payload }
            : state.currentChat,
      };

    case CHAT_ACTIONS.REMOVE_CHAT:
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== action.payload),
        currentChat:
          state.currentChat?.id === action.payload ? null : state.currentChat,
      };

    case CHAT_ACTIONS.SET_CURRENT_CHAT:
      return { ...state, currentChat: action.payload };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      const { chatId, message } = action.payload;
      const existingMessages = state.messages[chatId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...existingMessages, message],
        },
      };

    case CHAT_ACTIONS.UPDATE_MESSAGE:
      const { chatId: updateChatId, messageId, updates } = action.payload;
      const chatMessages = state.messages[updateChatId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateChatId]: chatMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        },
      };

    case CHAT_ACTIONS.REMOVE_MESSAGE:
      const { chatId: removeChatId, messageId: removeMessageId } =
        action.payload;
      const remainingMessages = state.messages[removeChatId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [removeChatId]: remainingMessages.filter(
            (msg) => msg.id !== removeMessageId
          ),
        },
      };

    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: action.payload.count,
        },
      };

    case CHAT_ACTIONS.UPDATE_UNREAD_COUNT:
      const currentCount = state.unreadCounts[action.payload.chatId] || 0;
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: Math.max(
            0,
            currentCount + action.payload.delta
          ),
        },
      };

    case CHAT_ACTIONS.SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload, isSearching: false };

    case CHAT_ACTIONS.SET_SEARCHING:
      return { ...state, isSearching: action.payload };

    case CHAT_ACTIONS.CLEAR_SEARCH:
      return { ...state, searchResults: [], isSearching: false };

    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// ChatProvider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { socket, addEventListener } = useSocket();

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    const unsubscribers = [];

    // New message handler
    unsubscribers.push(
      addEventListener("newMessage", (data) => {
        const { message, chatId } = data;
        dispatch({
          type: CHAT_ACTIONS.ADD_MESSAGE,
          payload: { chatId, message },
        });

        // Update chat's last message and activity
        dispatch({
          type: CHAT_ACTIONS.UPDATE_CHAT,
          payload: {
            id: chatId,
            lastMessage: message,
            lastActivity: message.createdAt,
          },
        });

        // Update unread count if not current chat
        if (state.currentChat?.id !== chatId) {
          dispatch({
            type: CHAT_ACTIONS.UPDATE_UNREAD_COUNT,
            payload: { chatId, delta: 1 },
          });
        }
      })
    );

    // Message edited handler
    unsubscribers.push(
      addEventListener("messageEdited", (data) => {
        const { messageId, newContent, editedAt } = data;
        // Find which chat contains this message
        Object.keys(state.messages).forEach((chatId) => {
          const hasMessage = state.messages[chatId]?.some(
            (msg) => msg.id === messageId
          );
          if (hasMessage) {
            dispatch({
              type: CHAT_ACTIONS.UPDATE_MESSAGE,
              payload: {
                chatId,
                messageId,
                updates: { content: newContent, isEdited: true, editedAt },
              },
            });
          }
        });
      })
    );

    // Message deleted handler
    unsubscribers.push(
      addEventListener("messageDeleted", (data) => {
        const { messageId } = data;
        // Find which chat contains this message
        Object.keys(state.messages).forEach((chatId) => {
          const hasMessage = state.messages[chatId]?.some(
            (msg) => msg.id === messageId
          );
          if (hasMessage) {
            dispatch({
              type: CHAT_ACTIONS.REMOVE_MESSAGE,
              payload: { chatId, messageId },
            });
          }
        });
      })
    );

    // Message read handler
    unsubscribers.push(
      addEventListener("messageRead", (data) => {
        const { messageId, readBy, readAt } = data;
        // Find which chat contains this message
        Object.keys(state.messages).forEach((chatId) => {
          const hasMessage = state.messages[chatId]?.some(
            (msg) => msg.id === messageId
          );
          if (hasMessage) {
            dispatch({
              type: CHAT_ACTIONS.UPDATE_MESSAGE,
              payload: {
                chatId,
                messageId,
                updates: {
                  readBy: [
                    ...(state.messages[chatId].find((m) => m.id === messageId)
                      ?.readBy || []),
                    { user: readBy, readAt },
                  ],
                },
              },
            });
          }
        });
      })
    );

    // Unread count update handler
    unsubscribers.push(
      addEventListener("unreadCountUpdate", (data) => {
        const { chatId, unreadCount } = data;
        dispatch({
          type: CHAT_ACTIONS.SET_UNREAD_COUNT,
          payload: { chatId, count: unreadCount },
        });
      })
    );

    // Cleanup function
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [socket, user, addEventListener, state.currentChat?.id, state.messages]);

  // Load user chats
  const loadChats = useCallback(async () => {
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await request.chat.getUserChats();

      if (result.success) {
        dispatch({
          type: CHAT_ACTIONS.SET_CHATS,
          payload: result.data.data.chats,
        });

        // Load unread counts for each chat
        result.data.data.chats.forEach(async (chat) => {
          const unreadResult = await request.message.getUnreadCount(chat.id);
          if (unreadResult.success) {
            dispatch({
              type: CHAT_ACTIONS.SET_UNREAD_COUNT,
              payload: {
                chatId: chat.id,
                count: unreadResult.data.data.unreadCount,
              },
            });
          }
        });
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: result.error });
      }
    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: "Failed to load chats",
      });
    }
  }, []);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId, page = 1) => {
    if (!chatId) return;

    try {
      const result = await request.message.getChatMessages(chatId, page);

      if (result.success) {
        dispatch({
          type: CHAT_ACTIONS.SET_MESSAGES,
          payload: { chatId, messages: result.data.data.messages },
        });
        return result.data.data.messages;
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }

    return [];
  }, []);

  // Set current chat
  const setCurrentChat = useCallback(
    (chat) => {
      dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CHAT, payload: chat });

      if (chat) {
        // Join socket room
        if (socket) {
          socket.emit("joinChat", chat.id);
        }

        // Load messages if not already loaded
        if (!state.messages[chat.id]) {
          loadMessages(chat.id);
        }

        // Mark all messages as read
        markAllAsRead(chat.id);
      }
    },
    [socket, state.messages, loadMessages]
  );

  // Create private chat
  const createPrivateChat = useCallback(async (participantId) => {
    try {
      const result = await request.chat.createPrivateChat(participantId);

      if (result.success) {
        const newChat = result.data.data.chat;
        dispatch({ type: CHAT_ACTIONS.ADD_CHAT, payload: newChat });
        return newChat;
      } else {
        toast.error(result.error);
        return null;
      }
    } catch (error) {
      toast.error("Failed to create chat");
      return null;
    }
  }, []);

  // Create group chat
  const createGroupChat = useCallback(async (chatData) => {
    try {
      const result = await request.chat.createGroupChat(chatData);

      if (result.success) {
        const newChat = result.data.data.chat;
        dispatch({ type: CHAT_ACTIONS.ADD_CHAT, payload: newChat });
        toast.success("Group chat created successfully");
        return newChat;
      } else {
        toast.error(result.error);
        return null;
      }
    } catch (error) {
      toast.error("Failed to create group chat");
      return null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (chatId, messageData) => {
      if (!socket) return;

      try {
        // Emit via socket for real-time delivery
        socket.emit("sendMessage", {
          chatId,
          ...messageData,
        });

        // Also send via API for persistence
        const result = await request.message.sendMessage(chatId, messageData);

        if (!result.success) {
          toast.error("Failed to send message");
        }
      } catch (error) {
        toast.error("Failed to send message");
      }
    },
    [socket]
  );

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId, chatId) => {
      if (socket) {
        socket.emit("markAsRead", { messageId, chatId });
      }

      try {
        await request.message.markMessageAsRead(messageId);
      } catch (error) {
        console.error("Failed to mark message as read:", error);
      }
    },
    [socket]
  );

  // Mark all messages as read
  const markAllAsRead = useCallback(
    async (chatId) => {
      if (socket) {
        socket.emit("markAsRead", { chatId });
      }

      try {
        await request.message.markAllMessagesAsRead(chatId);
        dispatch({
          type: CHAT_ACTIONS.SET_UNREAD_COUNT,
          payload: { chatId, count: 0 },
        });
      } catch (error) {
        console.error("Failed to mark all messages as read:", error);
      }
    },
    [socket]
  );

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      dispatch({ type: CHAT_ACTIONS.CLEAR_SEARCH });
      return;
    }

    dispatch({ type: CHAT_ACTIONS.SET_SEARCHING, payload: true });

    try {
      const result = await request.user.searchUsers(query);

      if (result.success) {
        dispatch({
          type: CHAT_ACTIONS.SET_SEARCH_RESULTS,
          payload: result.data.data.users,
        });
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_SEARCH_RESULTS, payload: [] });
      }
    } catch (error) {
      dispatch({ type: CHAT_ACTIONS.SET_SEARCH_RESULTS, payload: [] });
    }
  }, []);

  // Context value
  const value = {
    // State
    chats: state.chats,
    currentChat: state.currentChat,
    messages: state.messages,
    unreadCounts: state.unreadCounts,
    loading: state.loading,
    error: state.error,
    searchResults: state.searchResults,
    isSearching: state.isSearching,

    // Actions
    loadChats,
    loadMessages,
    setCurrentChat,
    createPrivateChat,
    createGroupChat,
    sendMessage,
    markAsRead,
    markAllAsRead,
    searchUsers,

    // Computed values
    getCurrentChatMessages: () =>
      state.currentChat ? state.messages[state.currentChat.id] || [] : [],
    getTotalUnreadCount: () =>
      Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0),
    getChatUnreadCount: (chatId) => state.unreadCounts[chatId] || 0,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
};

export default ChatContext;
