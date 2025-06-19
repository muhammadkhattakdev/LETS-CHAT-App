import React, { useEffect, useState } from 'react';
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

  // Load chat when chatId changes
  useEffect(() => {
    if (chatId && (!currentChat || currentChat.id !== chatId)) {
      // Find chat from loaded chats or fetch chat details
      setMessagesLoading(true);
      
      const loadChatData = async () => {
        try {
          // In a real app, you'd fetch chat details here if not in local state
          // For now, we'll assume the chat is already loaded in the context
          await loadMessages(chatId);
        } catch (error) {
          console.error('Failed to load chat:', error);
        } finally {
          setMessagesLoading(false);
        }
      };

      loadChatData();
    } else if (!chatId) {
      // Clear current chat when no chatId
      setCurrentChat(null);
    }
  }, [chatId, currentChat, setCurrentChat, loadMessages]);

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