import React, { useEffect, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../commonComponents/sidebar/sidebar';
import { useAuth } from '../../commonComponents/authContext/authContext';
import { useSocket } from '../../commonComponents/socketContext/socketContext';
import { useChat } from '../../commonComponents/chatContext/chatContext';
import LoadingSpinner from '../../commonComponents/loadingSpinner/loadingSpinner';
import './style.css';

const ChatLayout = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { loadChats, loading, chats } = useChat();
  const loadChatsCalledRef = useRef(false);
  const loadTimeoutRef = useRef(null);

  // Debounced loadChats function to prevent multiple simultaneous calls
  const debouncedLoadChats = useCallback(() => {
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    // Set a timeout to delay the actual API call
    loadTimeoutRef.current = setTimeout(() => {
      if (!loadChatsCalledRef.current && user && !loading) {
        loadChatsCalledRef.current = true;
        console.log('Loading chats...');
        
        loadChats()
          .then(() => {
            console.log('Chats loaded successfully');
          })
          .catch((error) => {
            console.error('Failed to load chats:', error);
            // Reset the flag so it can be retried
            loadChatsCalledRef.current = false;
          });
      }
    }, 500); // 500ms delay to prevent rapid successive calls
  }, [user, loadChats, loading]);

  // Load chats when component mounts and user is available
  useEffect(() => {
    if (user && !loading && !loadChatsCalledRef.current && chats.length === 0) {
      debouncedLoadChats();
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [user?.id, debouncedLoadChats, loading, chats.length]); // Use user.id to prevent unnecessary effects

  // Reset the loadChatsCalledRef when user changes (logout/login)
  useEffect(() => {
    loadChatsCalledRef.current = false;
  }, [user?.id]);

  // Show loading spinner while initial data is loading
  if (loading && (!user || chats.length === 0)) {
    return (
      <div className="chat-layout-loading">
        <LoadingSpinner size="large" message="Loading your chats..." />
      </div>
    );
  }

  return (
    <div className="chat-layout">
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="connection-status">
          <div className="connection-status__indicator">
            <div className="connection-status__icon">
              <div className="connection-status__dot"></div>
            </div>
            <span className="connection-status__text">
              Reconnecting...
            </span>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="chat-layout__container">
        {/* Sidebar */}
        <aside className="chat-layout__sidebar">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <main className="chat-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;