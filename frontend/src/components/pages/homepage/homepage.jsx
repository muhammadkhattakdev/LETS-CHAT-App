import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, Users, Smile } from 'lucide-react';
import { useChat } from '../../commonComponents/chatContext/chatContext';
import { useAuth } from '../../commonComponents/authContext/authContext';
import ChatHeader from './homepageComponents/chatHeader/chatHeader';
import MessageList from './homepageComponents/messageList/messageList';
import MessageInput from './homepageComponents/messageInput/messageInput';
import WelcomeScreen from './homepageComponents/welcomeScreen/welcomeScreen';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import './style.css';

const Homepage = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const { 
    currentChat, 
    setCurrentChat, 
    loadMessages, 
    getCurrentChatMessages,
    loading 
  } = useChat();
  
  const [messagesLoading, setMessagesLoading] = useState(false);
  const loadingChatIdRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced loadMessages function to prevent multiple simultaneous calls
  const debouncedLoadMessages = useCallback(async (chatId) => {
    // Prevent multiple simultaneous loads for the same chat
    if (loadingChatIdRef.current === chatId || !chatId) {
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    loadingChatIdRef.current = chatId;
    setMessagesLoading(true);

    try {
      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if the request was aborted or chatId changed
      if (abortControllerRef.current?.signal.aborted || loadingChatIdRef.current !== chatId) {
        return;
      }

      console.log(`Loading messages for chat: ${chatId}`);
      await loadMessages(chatId);
      console.log(`Messages loaded successfully for chat: ${chatId}`);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load messages:', error);
      }
    } finally {
      // Only reset loading state if this is still the current request
      if (loadingChatIdRef.current === chatId) {
        setMessagesLoading(false);
        loadingChatIdRef.current = null;
      }
    }
  }, [loadMessages]);

  // Load chat when chatId changes
  useEffect(() => {
    if (chatId && (!currentChat || currentChat.id !== chatId)) {
      // Don't load if we're already loading this chat
      if (loadingChatIdRef.current === chatId) {
        return;
      }

      debouncedLoadMessages(chatId);
    } else if (!chatId) {
      // Clear current chat when no chatId
      setCurrentChat(null);
      setMessagesLoading(false);
      loadingChatIdRef.current = null;
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [chatId, currentChat?.id, setCurrentChat, debouncedLoadMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingChatIdRef.current = null;
    };
  }, []);

  // Show loading spinner during initial load
  if (loading) {
    return (
      <div className="homepage__loading">
        <LoadingSpinner size="large" message="Loading chat..." />
      </div>
    );
  }

  // Show welcome screen when no chat is selected
  if (!chatId || !currentChat) {
    return <WelcomeScreen />;
  }

  const messages = getCurrentChatMessages();

  return (
    <div className="homepage">
      {/* Chat Header */}
      <div className="homepage__header">
        <ChatHeader chat={currentChat} />
      </div>

      {/* Messages Area */}
      <div className="homepage__messages">
        {messagesLoading ? (
          <div className="homepage__messages-loading">
            <LoadingSpinner size="medium" message="Loading messages..." />
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            currentUserId={user?.id}
            chat={currentChat}
          />
        )}
      </div>

      {/* Message Input */}
      <div className="homepage__input">
        <MessageInput 
          chatId={currentChat.id}
          disabled={messagesLoading}
        />
      </div>
    </div>
  );
};

export default Homepage;