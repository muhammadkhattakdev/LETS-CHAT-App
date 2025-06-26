import React, { useEffect, useState, useRef } from 'react';
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
    chats,
    getCurrentChatMessages,
    loading 
  } = useChat();
  
  const [messagesLoading, setMessagesLoading] = useState(false);
  const lastChatIdRef = useRef(null);

  // Handle chat selection when chatId changes
  useEffect(() => {
    if (chatId && chatId !== lastChatIdRef.current) {
      // Prevent setting the same chat multiple times
      lastChatIdRef.current = chatId;
      
      // Find the chat from the chats list
      const selectedChat = chats.find(chat => chat.id === chatId);
      
      if (selectedChat) {
        // Check if it's a different chat than currently selected
        if (!currentChat || currentChat.id !== chatId) {
          console.log(`Selecting chat: ${chatId}`);
          setMessagesLoading(true);
          
          // setCurrentChat will handle loading messages internally
          setCurrentChat(selectedChat);
          
          // Reset loading state after a short delay
          setTimeout(() => {
            setMessagesLoading(false);
          }, 1000);
        }
      } else {
        // Chat not found in the list, might need to load chats first
        console.warn(`Chat ${chatId} not found in chats list`);
      }
    } else if (!chatId) {
      // Clear current chat when no chatId
      lastChatIdRef.current = null;
      setCurrentChat(null);
      setMessagesLoading(false);
    }
  }, [chatId, chats, setCurrentChat, currentChat?.id]);

  // Reset loading state when currentChat changes
  useEffect(() => {
    if (currentChat && currentChat.id === chatId) {
      setMessagesLoading(false);
    }
  }, [currentChat, chatId]);

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